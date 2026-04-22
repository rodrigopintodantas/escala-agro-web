#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Script para gerenciar variáveis CI/CD do GitLab baseado no formato fornecido
 *
 * Uso:
 * node scripts/gitlab-variables-manager.js --project-id <PROJECT_ID> --token <ACCESS_TOKEN> --file <VARIABLES_FILE>
 *
 * Exemplo:
 * node scripts/gitlab-variables-manager.js --project-id 123 --token glpat-xxxxx --file variables.json
 */

class GitLabVariablesManager {
    constructor(options) {
        this.projectId = options.projectId;
        this.groupId = options.groupId;
        this.accessToken = options.accessToken;
        this.gitlabUrl = options.gitlabUrl || 'https://gitlab.tjdft.jus.br';
        this.dryRun = options.dryRun || false;

        // Validação: deve ter projectId OU groupId, mas não ambos
        if (!this.projectId && !this.groupId) {
            throw new Error('É necessário fornecer --project-id ou --group-id');
        }
        if (this.projectId && this.groupId) {
            throw new Error('Forneça apenas --project-id OU --group-id, não ambos');
        }
    }

    /**
     * Retorna o endpoint base baseado no tipo (projeto ou grupo)
     */
    getBaseEndpoint() {
        if (this.projectId) {
            return `/api/v4/projects/${this.projectId}/variables`;
        } else {
            return `/api/v4/groups/${this.groupId}/variables`;
        }
    }

    /**
     * Faz uma requisição HTTP para a API do GitLab
     */
    async makeRequest(method, endpoint, data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(`${this.gitlabUrl}${this.getBaseEndpoint()}${endpoint}`);

            const options = {
                method,
                headers: {
                    'PRIVATE-TOKEN': this.accessToken,
                    'Content-Type': 'application/json'
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const req = https.request(url, options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsedData = responseData ? JSON.parse(responseData) : {};

                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsedData);
                        } else {
                            // Melhor tratamento de erro para HTTP 400
                            let errorMessage = `HTTP ${res.statusCode}`;

                            if (parsedData.message) {
                                errorMessage += `: ${parsedData.message}`;
                            } else if (parsedData.error) {
                                errorMessage += `: ${parsedData.error}`;
                            } else if (parsedData.errors) {
                                // Para erros de validação do GitLab
                                if (Array.isArray(parsedData.errors)) {
                                    errorMessage += `: ${parsedData.errors.join(', ')}`;
                                } else if (typeof parsedData.errors === 'object') {
                                    const errorDetails = Object.entries(parsedData.errors)
                                        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                                        .join('; ');
                                    errorMessage += `: ${errorDetails}`;
                                }
                            } else if (responseData) {
                                errorMessage += `: ${responseData}`;
                            }

                            reject(new Error(errorMessage));
                        }
                    } catch (error) {
                        reject(new Error(`Erro ao processar resposta: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * Lista todas as variáveis do projeto
     */
    async listVariables() {
        try {
            const variables = await this.makeRequest('GET', '');
            return variables;
        } catch (error) {
            throw new Error(`Erro ao listar variáveis: ${error.message}`);
        }
    }

    /**
     * Cria ou atualiza uma variável
     */
    async setVariable(key, value, options = {}) {
        // Validações básicas
        if (!key || key.trim() === '') {
            throw new Error('Nome da variável não pode estar vazio');
        }

        if (value === undefined || value === null) {
            throw new Error('Valor da variável não pode ser undefined ou null');
        }

        // Log de debug para variáveis problemáticas
        if (key.includes('PRODUCTION')) {
            console.log(`🔍 Debug - Configurando variável ${key}:`);
            console.log(`   Valor: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
            console.log(`   Tamanho: ${value.length} caracteres`);
            console.log(`   Protected: ${options.protected}`);
            console.log(`   Masked: ${options.masked}`);
        }

        const variableData = {
            key,
            value,
            protected: options.protected || false,
            masked: options.masked || false,
            raw: options.raw || false,
            environment_scope: options.environmentScope || '*'
        };

        try {
            if (this.dryRun) {
                console.log(`[DRY RUN] Criando/atualizando variável: ${key}`);
                return { key, value, ...variableData };
            }

            // Primeiro tenta atualizar
            try {
                const result = await this.makeRequest('PUT', `/${encodeURIComponent(key)}`, variableData);
                console.log(`✅ Variável atualizada: ${key}`);
                return result;
            } catch (error) {
                // Se não existe, cria nova
                const result = await this.makeRequest('POST', '', variableData);
                console.log(`✅ Variável criada: ${key}`);
                return result;
            }
        } catch (error) {
            throw new Error(`Erro ao configurar variável ${key}: ${error.message}`);
        }
    }

    /**
     * Remove uma variável
     */
    async deleteVariable(key) {
        try {
            if (this.dryRun) {
                console.log(`[DRY RUN] Removendo variável: ${key}`);
                return;
            }

            await this.makeRequest('DELETE', `/${encodeURIComponent(key)}`);
            console.log(`✅ Variável removida: ${key}`);
        } catch (error) {
            throw new Error(`Erro ao remover variável ${key}: ${error.message}`);
        }
    }

    /**
     * Remove todas as variáveis
     */
    async deleteAllVariables() {
        try {
            const variables = await this.listVariables();

            console.log(`📝 Total de variáveis encontradas: ${variables.length}`);
            if (variables.length === 0) {
                console.log('📋 Nenhuma variável encontrada para remover.');
                return;
            }

            const scope = this.projectId ? 'projeto' : 'grupo';
            console.log(`🗑️  Removendo ${variables.length} variáveis do ${scope}...\n`);

            let successCount = 0;
            let errorCount = 0;

            for (const variable of variables) {
                try {
                    await this.deleteVariable(variable.key);
                    successCount++;
                } catch (error) {
                    console.error(`❌ Erro ao remover ${variable.key}: ${error.message}`);
                    errorCount++;
                }
            }

            console.log(`\n Resumo da exclusão:`);
            console.log(`✅ Variáveis removidas: ${successCount}`);
            if (errorCount > 0) {
                console.log(`❌ Erros: ${errorCount}`);
            }
        } catch (error) {
            throw new Error(`Erro ao listar variáveis para exclusão: ${error.message}`);
        }
    }

    /**
     * Carrega variáveis do arquivo no formato fornecido
     */
    loadVariablesFromFile(filePath) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');

            // Tenta parsear como JSON primeiro
            try {
                return JSON.parse(fileContent);
            } catch (jsonError) {
                // Se não for JSON válido, tenta parsear como o formato fornecido
                return this.parseCustomFormat(fileContent);
            }
        } catch (error) {
            throw new Error(`Erro ao carregar arquivo: ${error.message}`);
        }
    }

    /**
     * Parse do formato customizado fornecido
     */
    parseCustomFormat(content) {
        const variables = [];
        const lines = content.split('\n');
        let currentVariable = null;
        let inArray = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Detecta início de array
            if (line.includes('CI/CD VARIABLES') || line.includes('Group variables')) {
                inArray = true;
                continue;
            }

            // Detecta fim de array
            if (line === ']' && inArray) {
                inArray = false;
                continue;
            }

            // Detecta início de objeto
            if (line === '{') {
                currentVariable = {};
                continue;
            }

            // Detecta fim de objeto
            if (line === '},' || line === '}') {
                if (currentVariable && currentVariable.Key) {
                    variables.push(currentVariable);
                }
                currentVariable = null;
                continue;
            }

            // Parse das propriedades - CORRIGIDO para lidar com valores que contêm ':'
            if (currentVariable && line.includes(':')) {
                // Encontra o primeiro ':' para separar chave do valor
                const firstColonIndex = line.indexOf(':');
                const key = line.substring(0, firstColonIndex).trim();
                const value = line.substring(firstColonIndex + 1).trim();

                const cleanKey = key.replace(/[{}]/g, '').trim();
                const cleanValue = value.replace(/[,}]/g, '').trim();

                switch (cleanKey) {
                    case 'Key':
                        currentVariable.Key = cleanValue;
                        break;
                    case 'Visibility':
                        currentVariable.Visibility = cleanValue;
                        break;
                    case 'Value':
                        currentVariable.Value = cleanValue;
                        break;
                }
            }
        }

        return variables;
    }

    /**
     * Aplica variáveis do arquivo
     */
    async applyVariablesFromFile(filePath) {
        console.log('🚀 Carregando variáveis do arquivo...\n');

        const variables = this.loadVariablesFromFile(filePath);

        if (!Array.isArray(variables)) {
            throw new Error('Formato de arquivo inválido. Esperado um array de variáveis.');
        }

        console.log(`📝 Encontradas ${variables.length} variáveis para configurar\n`);

        for (const variable of variables) {
            if (!variable.Key || !variable.Value) {
                console.warn(`⚠️  Variável inválida ignorada: ${JSON.stringify(variable)}`);
                continue;
            }

            const options = {
                masked: variable.Visibility === 'Masked',
                protected: false,
                raw: false
            };

            // Configurações específicas baseadas no nome da variável
            if (variable.Key.includes('PRODUCTION')) {
                options.protected = true;

                // Validações específicas para variáveis de produção
                if (!variable.Value || variable.Value.trim() === '') {
                    console.warn(`⚠️  Variável de produção ${variable.Key} tem valor vazio`);
                }

                // Verifica se o valor não é muito longo (limite do GitLab é 255 caracteres)
                if (variable.Value.length > 255) {
                    console.warn(`⚠️  Variável ${variable.Key} tem valor muito longo (${variable.Value.length} caracteres)`);
                }
            }

            try {
                await this.setVariable(variable.Key, variable.Value, options);
            } catch (error) {
                console.error(`❌ Erro ao configurar ${variable.Key}: ${error.message}`);
            }
        }

        console.log('\n✅ Configuração concluída!');
    }

    /**
     * Exibe variáveis atuais
     */
    async showCurrentVariables() {
        try {
            const variables = await this.listVariables();
            const scope = this.projectId ? 'projeto' : 'grupo';
            console.log(`📋 Variáveis atuais do ${scope}:\n`);

            console.log(`📝 Total de variáveis encontradas: ${variables.length}`);
            if (variables.length === 0) {
                console.log('Nenhuma variável configurada.');
                return;
            }

            variables.forEach(variable => {
                const value = variable.masked ? '***MASKED***' : variable.value;
                const visibility = variable.masked ? 'Masked' : 'Visible';
                const protection = variable.protected ? ' (Protected)' : '';

                console.log(`Key: ${variable.key}`);
                console.log(`Visibility: ${visibility}`);
                console.log(`Value: ${value}${protection}`);
                console.log('');
            });
        } catch (error) {
            console.log(error)
            console.error(`❌ Erro ao listar variáveis: ${error.message}`);
        }
    }

    /**
     * Exporta variáveis atuais para o formato do arquivo
     */
    async exportVariablesToFile(outputPath) {
        try {
            const variables = await this.listVariables();

            const exportData = variables.map(variable => ({
                Key: variable.key,
                Visibility: variable.masked ? 'Masked' : 'Visible',
                Value: variable.masked ? '***MASKED***' : variable.value
            }));

            const content = `CI/CD VARIABLES
${JSON.stringify(exportData, null, 2)}`;

            fs.writeFileSync(outputPath, content);
            console.log(`✅ Variáveis exportadas para: ${outputPath}`);
        } catch (error) {
            console.error(`❌ Erro ao exportar variáveis: ${error.message}`);
        }
    }
    /**
     * Busca chave pública AGE do GitLab usando nome da variável
     */
    async getAgePublicKeyFromGitLab(variableName) {
        try {
            console.log(`🔑 Buscando chave AGE do GitLab: ${variableName}`);
            const variables = await this.listVariables();
            const ageVariable = variables.find(v => v.key === variableName);

            if (!ageVariable) {
                throw new Error(`Variável '${variableName}' não encontrada no GitLab`);
            }

            console.log(`✅ Chave AGE encontrada: ${ageVariable.key}`);
            return ageVariable.value;
        } catch (error) {
            throw new Error(`Erro ao buscar chave AGE: ${error.message}`);
        }
    }

    /**
     * Criptografa arquivo usando SOPS
     */
    async encryptWithSops(inputFile, outputFile, agePublicKey) {
        return new Promise((resolve, reject) => {
            const { exec } = require('child_process');

            // Verifica se o arquivo de entrada existe
            if (!fs.existsSync(inputFile)) {
                reject(new Error(`Arquivo de entrada não encontrado: ${inputFile}`));
                return;
            }

            // Monta o comando com redirecionamento de saída
            const command = `sops -e --age ${agePublicKey} ${inputFile} > ${outputFile}`;

            console.log(`🔐 Executando: ${command}`);

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`SOPS falhou: ${error.message}`));
                    return;
                }

                if (stderr) {
                    console.warn(`⚠️  Avisos do SOPS: ${stderr}`);
                }

                console.log(`🔐 Arquivo criptografado salvo: ${outputFile}`);
                resolve();
            });
        });
    }

    /**
     * Executa comando SOPS com redirecionamento de saída
     * sops -e --age $AGE_PUBLIC_KEY_STAGE $HELM_CHART_SECRETS_DEC_FILE > $HELM_CHART_SECRETS_FILE
     */
    async executeSopsCommand(ageKeyVariable, inputFile, outputFile) {
        try {
            // Busca a chave AGE do GitLab
            console.log(`🔑 Buscando chave AGE do GitLab: ${ageKeyVariable}`);
            const agePublicKey = await this.getAgePublicKeyFromGitLab(ageKeyVariable);

            // Verifica se os arquivos existem
            if (!fs.existsSync(inputFile)) {
                throw new Error(`Arquivo de entrada não encontrado: ${inputFile}`);
            }

            console.log(`🔐 Executando SOPS para criptografar ${inputFile} -> ${outputFile}`);
            console.log(`📋 Comando: sops -e --age ${agePublicKey} ${inputFile} > ${outputFile}`);

            if (this.dryRun) {
                console.log(`[DRY RUN] Comando SOPS seria executado`);
                return;
            }

            return new Promise((resolve, reject) => {
                const { exec } = require('child_process');

                // Monta o comando com redirecionamento de saída
                const command = `sops -e --age ${agePublicKey} ${inputFile} > ${outputFile}`;

                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(`SOPS falhou: ${error.message}`));
                        return;
                    }

                    if (stderr) {
                        console.warn(`⚠️  Avisos do SOPS: ${stderr}`);
                    }

                    console.log(`✅ Arquivo criptografado salvo: ${outputFile}`);
                    resolve();
                });
            });
        } catch (error) {
            throw new Error(`Erro ao executar comando SOPS: ${error.message}`);
        }
    }
}

/**
 * Função principal
 */
async function main() {
    const args = process.argv.slice(2);
    const options = {};

    // Parse argumentos
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace('--', '');
        const value = args[i + 1];

        switch (key) {
            case 'project-id':
                options.projectId = value;
                break;
            case 'group-id':
                options.groupId = value;
                break;
            case 'token':
                options.accessToken = value;
                break;
            case 'file':
                options.file = value;
                break;
            case 'gitlab-url':
                options.gitlabUrl = value;
                break;
            case 'dry-run':
                options.dryRun = true;
                i--; // Não há valor para dry-run
                break;
            case 'list':
                options.listOnly = true;
                i--; // Não há valor para list
                break;
            case 'export':
                options.exportTo = value;
                break;
            case 'delete-all':
                options.deleteAll = true;
                i--; // Não há valor para delete-all
                break;
            case 'generate-secrets':
                options.generateSecrets = value;
                break;
            case 'environment':
                options.environment = value;
                break;
            case 'age-public-key':
                options.agePublicKey = value;
                break;
            case 'use-sops':
                options.useSops = true;
                i--; // Não há valor para use-sops
                break;
            case 'input-file':
                options.inputFile = value;
                break;
            case 'age-key-variable':
                options.ageKeyVariable = value;
                break;
            case 'sops-encrypt':
                options.sopsEncrypt = true;
                i--; // Não há valor para sops-encrypt
                break;
            case 'sops-input':
                options.sopsInput = value;
                break;
            case 'sops-output':
                options.sopsOutput = value;
                break;
        }
    }

    // Validação
    if ((!options.projectId && !options.groupId) || !options.accessToken) {
        console.error('❌ Erro: --project-id OU --group-id e --token são obrigatórios');
        console.log('\nUso:');
        console.log('  node scripts/gitlab-variables-manager.js --project-id <ID> --token <TOKEN> [opções]');
        console.log('  node scripts/gitlab-variables-manager.js --group-id <ID> --token <TOKEN> [opções]');
        console.log('\nOpções:');
        console.log('  --project-id <id>       ID do projeto GitLab');
        console.log('  --group-id <id>         ID do grupo GitLab');
        console.log('  --file <arquivo>        Arquivo com variáveis no formato fornecido');
        console.log('  --gitlab-url <url>      URL do GitLab (padrão: https://gitlab.tjdft.jus.br)');
        console.log('  --dry-run               Simula execução sem fazer alterações');
        console.log('  --list                  Apenas lista variáveis atuais');
        console.log('  --export <arquivo>      Exporta variáveis atuais para arquivo');
        console.log('  --delete-all            Remove todas as variáveis');
        console.log('  --sops-encrypt          Executa comando SOPS para criptografar arquivo');
        console.log('  --age-key-variable <var> Nome da variável GitLab com chave AGE');
        console.log('  --sops-input <arquivo>  Arquivo de entrada para SOPS');
        console.log('  --sops-output <arquivo> Arquivo de saída para SOPS');
        process.exit(1);
    }

    try {
        const manager = new GitLabVariablesManager(options);

        if (options.listOnly) {
            await manager.showCurrentVariables();
        } else if (options.exportTo) {
            await manager.exportVariablesToFile(options.exportTo);
        } else if (options.deleteAll) {
            await manager.deleteAllVariables();
        } else if (options.generateSecrets) {
            const environment = options.environment || 'stage';
            const sopsOptions = {
                useSops: options.useSops,
                agePublicKey: options.agePublicKey,
                inputFile: options.inputFile,
                ageKeyVariable: options.ageKeyVariable
            };

            // Se não foi fornecida chave AGE diretamente, mas foi especificada uma variável, busca do GitLab
            if (!sopsOptions.agePublicKey && sopsOptions.ageKeyVariable) {
                sopsOptions.agePublicKey = await manager.getAgePublicKeyFromGitLab(sopsOptions.ageKeyVariable);
            }

            await manager.generateSecretsYaml(environment, options.generateSecrets, sopsOptions);
        } else if (options.sopsEncrypt) {
            // Nova funcionalidade para executar comando SOPS
            if (!options.ageKeyVariable || !options.sopsInput || !options.sopsOutput) {
                throw new Error('Para --sops-encrypt é necessário fornecer --age-key-variable, --sops-input e --sops-output');
            }
            await manager.executeSopsCommand(options.ageKeyVariable, options.sopsInput, options.sopsOutput);
        } else if (options.file) {
            await manager.applyVariablesFromFile(options.file);
        } else {
            process.exit(1);
        }
    } catch (error) {
        console.error(`❌ Erro: ${error.message}`);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = GitLabVariablesManager;
