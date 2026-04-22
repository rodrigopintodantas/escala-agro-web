{{/*
Expand the name of the chart.
*/}}
{{- define "escala-agro-web.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "escala-agro-web.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "escala-agro-web.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "escala-agro-web.labels" -}}
helm.sh/chart: {{ include "escala-agro-web.chart" . }}
{{ include "escala-agro-web.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "escala-agro-web.selectorLabels" -}}
app.kubernetes.io/name: {{ include "escala-agro-web.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "escala-agro-web.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "escala-agro-web.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Credenciais para que o Cluster possa fazer Pull de imagens no registry do projeto (ou grupo) no GitLab
*/}}
{{- define "escala-agro-web.imagePullSecret" }}
{{- with .Values.image.credentials }}
{{- printf "{\"auths\":{\"%s\":{\"username\":\"%s\",\"password\":\"%s\",\"auth\":\"%s\"}}}"
  (required "Campo .image.credentials.registry é obrigatório e não foi preenchido" .registry)
  (required "Campo .image.credentials.username é obrigatório e não foi preenchido" .username)
  (required "Campo .image.credentials.password é obrigatório e não foi preenchido" .password)
  (printf "%s:%s" .username .password | b64enc) | squote }}
{{- end }}
{{- end }}
