resource "azurerm_signalr_service" "signalr" {
  name                = "sigr-${var.project_name}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  sku {
    name     = "Free_F1"
    capacity = 1
  }

  cors {
    allowed_origins = ["*"]
  }

  connectivity_logs_enabled = true
  messaging_logs_enabled      = true
  service_mode              = "Default"
}

output "signalr_connection_string" {
  value     = azurerm_signalr_service.signalr.primary_connection_string
  sensitive = true
}
