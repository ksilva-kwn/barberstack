# =============================================================================
# Terraform Import Blocks
#
# Importa recursos que já existem no AWS para o state do Terraform.
# Necessário quando um parâmetro foi criado fora do Terraform (ex: manualmente
# via console ou CLI) antes de ser adicionado à configuração.
#
# Após o primeiro `terraform apply` bem-sucedido com estes blocos,
# os recursos ficam gerenciados normalmente — os blocos podem ser removidos.
# =============================================================================

import {
  to = aws_ssm_parameter.asaas_env
  id = "/barberstack/production/ASAAS_ENV"
}

import {
  to = aws_ssm_parameter.asaas_transfer_validation_token
  id = "/barberstack/production/ASAAS_TRANSFER_VALIDATION_TOKEN"
}
