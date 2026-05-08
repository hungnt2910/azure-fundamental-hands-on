variable "project_name" {
  description = "Tên dự án dùng làm tiền tố cho các tài nguyên"
  type        = string
  default     = "azure-img-gallery"
}

variable "location" {
  description = "Vị trí địa lý của Azure resources"
  type        = string
  default     = "East US"
}

variable "resource_group_name" {
  description = "Tên Resource Group"
  type        = string
  default     = "rg-azure-img-gallery"
}
