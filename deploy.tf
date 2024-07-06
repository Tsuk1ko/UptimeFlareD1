terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4"
    }
  }
}

provider "cloudflare" {
  # read token from $CLOUDFLARE_API_TOKEN
}

variable "CLOUDFLARE_ACCOUNT_ID" {
  # read account id from $TF_VAR_CLOUDFLARE_ACCOUNT_ID
  type = string
}

resource "cloudflare_d1_database" "uptimeflare_db" {
  account_id = var.CLOUDFLARE_ACCOUNT_ID
  name       = "uptimeflare-db"
}

resource "cloudflare_worker_script" "uptimeflare" {
  account_id         = var.CLOUDFLARE_ACCOUNT_ID
  name               = "uptimeflare_worker"
  content            = file("worker/dist/index.js")
  module             = true
  compatibility_date = "2023-11-08"

  d1_database_binding {
    name        = "UPTIMEFLARE_DB"
    database_id = cloudflare_d1_database.uptimeflare_db.id
  }
}

resource "cloudflare_worker_cron_trigger" "uptimeflare_worker_cron" {
  account_id  = var.CLOUDFLARE_ACCOUNT_ID
  script_name = cloudflare_worker_script.uptimeflare.name
  schedules = [
    "* * * * *", # every 1 minute
  ]
}

resource "cloudflare_pages_project" "uptimeflare" {
  account_id        = var.CLOUDFLARE_ACCOUNT_ID
  name              = "uptimeflare"
  production_branch = "main"

  deployment_configs {
    production {
      d1_databases = {
        UPTIMEFLARE_DB = cloudflare_d1_database.uptimeflare_db.id
      }
      compatibility_date  = "2023-11-08"
      compatibility_flags = ["nodejs_compat"]
    }
  }
}
