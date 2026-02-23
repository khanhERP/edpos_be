// @ts-nocheck
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";
import { } from "./db";

interface TenantConfig {
  subdomain: string;
  databaseUrl: string;
  storeName: string;
  isActive: boolean;
}

class TenantManager {
  private tenants: Map<string, TenantConfig> = new Map();
  private dbConnections: Map<string, any> = new Map();

  constructor() {
    this.loadTenants();
  }

  private loadTenants() {
    // Load tenant configurations from environment or main database
    const tenantsConfig = [
      {
        subdomain: "0318225421",
        databaseUrl: process.env.EXTERNAL_DB_URL || process.env.DATABASE_URL!,
        storeName: "Store 1 - Cửa hàng 0318225421",
        isActive: true,
      },
      {
        subdomain: "0111156080",
        databaseUrl:
          process.env.DATABASE_0111156080 ||
          process.env.EXTERNAL_DB_0111156080 ||
          process.env.DATABASE_URL!,
        storeName: "Store 2 - Cửa hàng 0111156080",
        isActive: true,
      },
      {
        subdomain: "demo",
        databaseUrl: process.env.DATABASE_demo || process.env.EXTERNAL_DB_demo!,
        storeName: "Store 0 - Cửa hàng demo",
        isActive: true,
      },
      {
        subdomain: "hazkitchen",
        databaseUrl:
          process.env.DATABASE_hazkitchen ||
          process.env.EXTERNAL_DB_hazkitchen!,
        storeName: "Store 3 - Cửa hàng hazkitchen",
        isActive: true,
      },
      {
        subdomain: "0318671828",
        databaseUrl:
          process.env.DATABASE_0318671828 ||
          process.env.EXTERNAL_DB_0318671828 ||
          process.env.DATABASE_URL!,
        storeName: "Store 2 - Cửa hàng 0318671828",
        isActive: true,
      },
      {
        subdomain: "0108670987-001",
        databaseUrl:
          process.env.DATABASE_0108670987 ||
          process.env.EXTERNAL_DB_0108670987!,
        storeName: "Store 5 - Cửa hàng 0108670987",
        isActive: true,
      },
      {
        subdomain: "060088013201",
        databaseUrl:
          process.env.DATABASE_060088013201 ||
          process.env.EXTERNAL_DB_060088013201!,
        storeName: "Store 5 - Cửa hàng 060088013201",
        isActive: true,
      },
      {
        subdomain: "036194019168",
        databaseUrl:
          process.env.DATABASE_036194019168 ||
          process.env.EXTERNAL_DB_036194019168!,
        storeName: "Store 5 - Cửa hàng 036194019168",
        isActive: true,
      },
      {
        subdomain: "066200000186",
        databaseUrl:
          process.env.EXTERNAL_066200000186 ||
          process.env.DATABASE_066200000186!,
        storeName: "Store 6 - Cửa hàng 066200000186",
        isActive: true,
      },
      {
        subdomain: "8603725152-001",
        databaseUrl:
          process.env.EXTERNAL_8603725152 || process.env.DATABASE_8603725152!,
        storeName: "Store 6 - Cửa hàng 8603725152-001",
        isActive: true,
      },
      {
        subdomain: "0972909983",
        databaseUrl:
          process.env.EXTERNAL_0972909983 || process.env.DATABASE_0972909983!,
        storeName: "Store 6 - Cửa hàng 0972909983",
        isActive: true,
      },
      {
        subdomain: "001093040802",
        databaseUrl:
          process.env.EXTERNAL_001093040802 ||
          process.env.DATABASE_001093040802!,
        storeName: "Store 6 - Cửa hàng 001093040802",
        isActive: true,
      },
      {
        subdomain: "227093000003",
        databaseUrl:
          process.env.EXTERNAL_227093000003 ||
          process.env.DATABASE_227093000003!,
        storeName: "Store 6 - Cửa hàng 227093000003",
        isActive: true,
      },
      {
        subdomain: "8045550047",
        databaseUrl:
          process.env.EXTERNAL_8045550047 || process.env.DATABASE_8045550047!,
        storeName: "Store 6 - Cửa hàng 8045550047",
        isActive: true,
      },
      {
        subdomain: "8355337985",
        databaseUrl:
          process.env.EXTERNAL_8355337985 || process.env.DATABASE_8355337985!,
        storeName: "Store 6 - Cửa hàng 8355337985",
        isActive: true,
      },
      {
        subdomain: "001097090862",
        databaseUrl:
          process.env.EXTERNAL_001097090862 ||
          process.env.DATABASE_001097090862!,
        storeName: "Store 7 - Cửa hàng 001097090862",
        isActive: true,
      },
      {
        subdomain: "0111063848",
        databaseUrl:
          process.env.EXTERNAL_0111063848 || process.env.DATABASE_0111063848!,
        storeName: "Store 8 - Cửa hàng 0111063848",
        isActive: true,
      },
      {
        subdomain: "0353133905",
        databaseUrl:
          process.env.EXTERNAL_0353133905 || process.env.DATABASE_0353133905!,
        storeName: "Store 9 - Cửa hàng 0353133905",
        isActive: true,
      },
      {
        subdomain: "001181043568",
        databaseUrl:
          process.env.EXTERNAL_001181043568 ||
          process.env.DATABASE_001181043568!,
        storeName: "Store 10 - Cửa hàng 001181043568",
        isActive: true,
      },
      {
        subdomain: "0109636107",
        databaseUrl:
          process.env.EXTERNAL_0109636107 || process.env.DATABASE_0109636107!,
        storeName: "Store 11 - Cửa hàng 0109636107",
        isActive: true,
      },
      {
        subdomain: "0354140787",
        databaseUrl:
          process.env.EXTERNAL_0354140787 || process.env.DATABASE_0354140787!,
        storeName: "Store 12 - Cửa hàng 0354140787",
        isActive: true,
      },
      {
        subdomain: "0366995540",
        databaseUrl:
          process.env.EXTERNAL_0366995540 || process.env.DATABASE_0366995540!,
        storeName: "Store 13 - Cửa hàng 0366995540",
        isActive: true,
      },
      {
        subdomain: "5500153691",
        databaseUrl:
          process.env.EXTERNAL_5500153691 || process.env.DATABASE_5500153691!,
        storeName: "Store 14 - Cửa hàng 5500153691",
        isActive: true,
      },
      {
        subdomain: "4601629329",
        databaseUrl:
          process.env.EXTERNAL_4601629329 || process.env.DATABASE_4601629329!,
        storeName: "Store 15 - Cửa hàng 4601629329",
        isActive: true,
      },
      {
        subdomain: "2803185369",
        databaseUrl:
          process.env.EXTERNAL_2803185369 || process.env.DATABASE_2803185369!,
        storeName: "Store 16 - Cửa hàng 2803185369",
        isActive: true,
      },
      {
        subdomain: "0317290403",
        databaseUrl:
          process.env.EXTERNAL_0317290403 || process.env.DATABASE_0317290403!,
        storeName: "Store 17 - Cửa hàng 0317290403",
        isActive: true,
      },
      {
        subdomain: "8534009211-001",
        databaseUrl:
          process.env.EXTERNAL_8534009211_001 ||
          process.env.DATABASE_8534009211_001!,
        storeName: "Store 18 - Cửa hàng 8534009211-001",
        isActive: true,
      },
      {
        subdomain: "082166003847",
        databaseUrl:
          process.env.EXTERNAL_082166003847 ||
          process.env.DATABASE_082166003847!,
        storeName: "Store 19 - Cửa hàng 082166003847",
        isActive: true,
      },
      {
        subdomain: "1201699647",
        databaseUrl:
          process.env.EXTERNAL_1201699647 || process.env.DATABASE_1201699647!,
        storeName: "Store 20 - Cửa hàng 1201699647",
        isActive: true,
      },
      {
        subdomain: "1201668085",
        databaseUrl:
          process.env.EXTERNAL_1201668085 || process.env.DATABASE_1201668085!,
        storeName: "Store 21 - Cửa hàng 1201668085",
        isActive: true,
      },
      {
        subdomain: "0107713807",
        databaseUrl:
          process.env.EXTERNAL_0107713807 || process.env.DATABASE_0107713807!,
        storeName: "Store 22 - Cửa hàng 0107713807",
        isActive: true,
      },
      {
        subdomain: "8143584654001",
        databaseUrl:
          process.env.EXTERNAL_8143584654001 ||
          process.env.DATABASE_8143584654001!,
        storeName: "Store 23 - Cửa hàng 8143584654001",
        isActive: true,
      },
      {
        subdomain: "8461064539",
        databaseUrl:
          process.env.EXTERNAL_8461064539 || process.env.DATABASE_8461064539!,
        storeName: "Store 24 - Cửa hàng 8461064539",
        isActive: true,
      },
      {
        subdomain: "1701985967",
        databaseUrl:
          process.env.EXTERNAL_1701985967 || process.env.DATABASE_1701985967!,
        storeName: "Store 25 - Cửa hàng 1701985967",
        isActive: true,
      },
      {
        subdomain: "8461635454",
        databaseUrl:
          process.env.EXTERNAL_8461635454 || process.env.DATABASE_8461635454!,
        storeName: "Store 26 - Cửa hàng 8461635454",
        isActive: true,
      },
      {
        subdomain: "0202109296",
        databaseUrl:
          process.env.EXTERNAL_0202109296 || process.env.DATABASE_0202109296!,
        storeName: "Store 27 - Cửa hàng 0202109296",
        isActive: true,
      },
      {
        subdomain: "0401704966",
        databaseUrl:
          process.env.EXTERNAL_0401704966 || process.env.DATABASE_0401704966!,
        storeName: "Store 28 - Cửa hàng 0401704966",
        isActive: true,
      },
      {
        subdomain: "0914444266",
        databaseUrl:
          process.env.EXTERNAL_0914444266 || process.env.DATABASE_0914444266!,
        storeName: "Store 29 - Cửa hàng 0914444266",
        isActive: true,
      },

      {
        subdomain: "0109878794",
        databaseUrl:
          process.env.EXTERNAL_0109878794 || process.env.DATABASE_0109878794!,
        storeName: "Store 30 - Cửa hàng 0109878794",
        isActive: true,
      },
      {
        subdomain: "0348193668",
        databaseUrl:
          process.env.EXTERNAL_0348193668 || process.env.DATABASE_0348193668!,
        storeName: "Store 31 - Cửa hàng 0348193668",
        isActive: true,
      },
      {
        subdomain: "8444092254",
        databaseUrl:
          process.env.EXTERNAL_8444092254 || process.env.DATABASE_8444092254!,
        storeName: "Store 32 - Cửa hàng 8444092254",
        isActive: true,
      },
      {
        subdomain: "8432864308",
        databaseUrl:
          process.env.EXTERNAL_8432864308 || process.env.DATABASE_8432864308!,
        storeName: "Store 33 - Cửa hàng 8432864308",
        isActive: true,
      },
      {
        subdomain: "1400831748",
        databaseUrl:
          process.env.EXTERNAL_1400831748 || process.env.DATABASE_1400831748!,
        storeName: "Store 34 - Cửa hàng 1400831748",
        isActive: true,
      },
      {
        subdomain: "0105077440",
        databaseUrl:
          process.env.EXTERNAL_0105077440 || process.env.DATABASE_0105077440!,
        storeName: "Store 35 - Cửa hàng 0105077440",
        isActive: true,
      },
      {
        subdomain: "4300524682-001",
        databaseUrl:
          process.env.EXTERNAL_4300524682_001 ||
          process.env.DATABASE_4300524682_001!,
        storeName: "Store 36 - Cửa hàng 4300524682-001",
        isActive: true,
      },
      {
        subdomain: "0305696261",
        databaseUrl:
          process.env.EXTERNAL_0305696261 || process.env.DATABASE_0305696261!,
        storeName: "Store 37 - Cửa hàng 0305696261",
        isActive: true,
      },
      {
        subdomain: "8495090914-001",
        databaseUrl:
          process.env.EXTERNAL_8495090914_001 ||
          process.env.DATABASE_8495090914_001!,
        storeName: "Store 38 - Cửa hàng 8495090914-001",
        isActive: true,
      },
      {
        subdomain: "8070104871",
        databaseUrl:
          process.env.EXTERNAL_8070104871 || process.env.DATABASE_8070104871!,
        storeName: "Store 39 - Cửa hàng 8070104871",
        isActive: true,
      },
      {
        subdomain: "3502101222",
        databaseUrl:
          process.env.EXTERNAL_3502101222 || process.env.DATABASE_3502101222!,
        storeName: "Store 40 - Cửa hàng 3502101222",
        isActive: true,
      },
      {
        subdomain: "0109558681",
        databaseUrl:
          process.env.EXTERNAL_0109558681 || process.env.DATABASE_0109558681!,
        storeName: "Store 41 - Cửa hàng 0109558681",
        isActive: true,
      },
      {
        subdomain: "0904333484",
        databaseUrl:
          process.env.EXTERNAL_0904333484 || process.env.DATABASE_0904333484!,
        storeName: "Store 42 - Cửa hàng 0904333484",
        isActive: true,
      },
      {
        subdomain: "0917015258",
        databaseUrl:
          process.env.EXTERNAL_0917015258 || process.env.DATABASE_0917015258!,
        storeName: "Store 43 - Cửa hàng 0917015258",
        isActive: true,
      },
      {
        subdomain: "0388848406",
        databaseUrl:
          process.env.EXTERNAL_0388848406 || process.env.DATABASE_0388848406!,
        storeName: "Store 44 - Cửa hàng 0388848406",
        isActive: true,
      },
      {
        subdomain: "02623919909",
        databaseUrl:
          process.env.EXTERNAL_02623919909 || process.env.DATABASE_02623919909!,
        storeName: "Store 45 - Cửa hàng 02623919909",
        isActive: true,
      },
      {
        subdomain: "0965478088",
        databaseUrl:
          process.env.EXTERNAL_0965478088 || process.env.DATABASE_0965478088!,
        storeName: "Store 46 - Cửa hàng 0965478088",
        isActive: true,
      },
      {
        subdomain: "0934509068",
        databaseUrl:
          process.env.EXTERNAL_0934509068 || process.env.DATABASE_0934509068!,
        storeName: "Store 47 - Cửa hàng 0934509068",
        isActive: true,
      },
      {
        subdomain: "0568888135",
        databaseUrl:
          process.env.EXTERNAL_0568888135 || process.env.DATABASE_0568888135!,
        storeName: "Store 48 - Cửa hàng 0568888135",
        isActive: true,
      },
      {
        subdomain: "8898105271-001",
        databaseUrl:
          process.env.EXTERNAL_8898105271_001 ||
          process.env.DATABASE_8898105271_001!,
        storeName: "Store 48 - Cửa hàng 8898105271-001",
        isActive: true,
      },
      {
        subdomain: "0877298335",
        databaseUrl:
          process.env.EXTERNAL_0877298335 || process.env.DATABASE_0877298335!,
        storeName: "Store 49 - Cửa hàng 0877298335",
        isActive: true,
      },
      {
        subdomain: "0937539144",
        databaseUrl:
          process.env.EXTERNAL_0937539144 || process.env.DATABASE_0937539144!,
        storeName: "Store 50 - Cửa hàng 0937539144",
        isActive: true,
      },
      {
        subdomain: "0989948041",
        databaseUrl:
          process.env.EXTERNAL_0989948041 || process.env.DATABASE_0989948041!,
        storeName: "Store 51 - Cửa hàng 0989948041",
        isActive: true,
      },
      {
        subdomain: "0929603669",
        databaseUrl:
          process.env.EXTERNAL_0929603669 || process.env.DATABASE_0929603669!,
        storeName: "Store 52 - Cửa hàng 0929603669",
        isActive: true,
      },
      {
        subdomain: "0983582722",
        databaseUrl:
          process.env.EXTERNAL_0983582722 || process.env.DATABASE_0983582722!,
        storeName: "Store 53 - Cửa hàng 0983582722",
        isActive: true,
      },
      {
        subdomain: "0948383878",
        databaseUrl:
          process.env.EXTERNAL_0948383878 || process.env.DATABASE_0948383878!,
        storeName: "Store 54 - Cửa hàng 0948383878",
        isActive: true,
      },
      {
        subdomain: "0933313565",
        databaseUrl:
          process.env.EXTERNAL_0933313565 || process.env.DATABASE_0933313565!,
        storeName: "Store 55 - Cửa hàng 0933313565",
        isActive: true,
      },
      {
        subdomain: "8464163489-001",
        databaseUrl:
          process.env.EXTERNAL_8464163489_001 || process.env.DATABASE_8464163489_001!,
        storeName: "Store 56 - Cửa hàng 8464163489-001",
        isActive: true,
      },
      {
        subdomain: "049077013185",
        databaseUrl:
          process.env.EXTERNAL_049077013185 || process.env.DATABASE_049077013185!,
        storeName: "Store 57 - Cửa hàng 049077013185",
        isActive: true,
      },
      {
        subdomain: "0366159779",
        databaseUrl:
          process.env.EXTERNAL_0366159779 || process.env.DATABASE_0366159779!,
        storeName: "Store 58 - Cửa hàng 0366159779",
        isActive: true,
      },
      {
        subdomain: "0984917743",
        databaseUrl:
          process.env.EXTERNAL_0984917743 || process.env.DATABASE_0984917743!,
        storeName: "Store 59 - Cửa hàng 0984917743",
        isActive: true,
      },
      {
        subdomain: "0945552112",
        databaseUrl:
          process.env.EXTERNAL_0945552112 || process.env.DATABASE_0945552112!,
        storeName: "Store 60 - Cửa hàng 0945552112",
        isActive: true,
      },
      {
        subdomain: "02438515047",
        databaseUrl:
          process.env.EXTERNAL_02438515047 || process.env.DATABASE_02438515047!,
        storeName: "Store 61 - Cửa hàng 02438515047",
        isActive: true,
      },
      {
        subdomain: "02435118521",
        databaseUrl:
          process.env.EXTERNAL_02435118521 || process.env.DATABASE_02435118521!,
        storeName: "Store 62 - Cửa hàng 02435118521",
        isActive: true,
      },
      {
        subdomain: "038189035681",
        databaseUrl:
          process.env.EXTERNAL_038189035681 || process.env.DATABASE_038189035681!,
        storeName: "Store 63 - Cửa hàng 038189035681",
        isActive: true,
      },
      {
        subdomain: "0869602712",
        databaseUrl:
          process.env.EXTERNAL_0869602712 || process.env.DATABASE_0869602712!,
        storeName: "Store 64 - Cửa hàng 0869602712",
        isActive: true,
      },
      {
        subdomain: "0903384088",
        databaseUrl:
          process.env.EXTERNAL_0903384088 || process.env.DATABASE_0903384088!,
        storeName: "Store 65 - Cửa hàng 0903384088",
        isActive: true,
      },
      {
        subdomain: "0962294012",
        databaseUrl:
          process.env.EXTERNAL_0962294012 || process.env.DATABASE_0962294012!,
        storeName: "Store 66 - Cửa hàng 0962294012",
        isActive: true,
      },
      {
        subdomain: "0394050078",
        databaseUrl:
          process.env.EXTERNAL_0394050078 || process.env.DATABASE_0394050078!,
        storeName: "Store 67 - Cửa hàng 0394050078",
        isActive: true,
      },
      {
        subdomain: "0989452680",
        databaseUrl:
          process.env.EXTERNAL_0989452680 || process.env.DATABASE_0989452680!,
        storeName: "Store 68 - Cửa hàng 0989452680",
        isActive: true,
      },
      {
        subdomain: "0909983832",
        databaseUrl:
          process.env.EXTERNAL_0909983832 || process.env.DATABASE_0909983832!,
        storeName: "Store 69 - Cửa hàng 0909983832",
        isActive: true,
      },
      {
        subdomain: "079154022813",
        databaseUrl:
          process.env.EXTERNAL_079154022813 || process.env.DATABASE_079154022813!,
        storeName: "Store 70 - Cửa hàng 079154022813",
        isActive: true,
      },
      {
        subdomain: "0913527089",
        databaseUrl:
          process.env.EXTERNAL_0913527089 || process.env.DATABASE_0913527089!,
        storeName: "Store 71 - Cửa hàng 0913527089",
        isActive: true,
      },
      {
        subdomain: "0939766755",
        databaseUrl:
          process.env.EXTERNAL_0939766755 || process.env.DATABASE_0939766755!,
        storeName: "Store 72 - Cửa hàng 0939766755",
        isActive: true,
      },
      {
        subdomain: "0918444256",
        databaseUrl:
          process.env.EXTERNAL_0918444256 || process.env.DATABASE_0918444256!,
        storeName: "Store 73 - Cửa hàng 0918444256",
        isActive: true,
      },
      {
        subdomain: "0905298414",
        databaseUrl:
          process.env.EXTERNAL_0905298414 || process.env.DATABASE_0905298414!,
        storeName: "Store 74 - Cửa hàng 0905298414",
        isActive: true,
      },
      {
        subdomain: "0107468094-001",
        databaseUrl:
          process.env.EXTERNAL_0107468094_001 || process.env.DATABASE_0107468094_001!,
        storeName: "Store 75 - Cửa hàng 0107468094-001",
        isActive: true,
      },
      {
        subdomain: "0352501968",
        databaseUrl:
          process.env.EXTERNAL_0352501968 || process.env.DATABASE_0352501968!,
        storeName: "Store 76 - Cửa hàng 0352501968",
        isActive: true,
      },
      {
        subdomain: "0877851336",
        databaseUrl:
          process.env.EXTERNAL_0877851336 || process.env.DATABASE_0877851336!,
        storeName: "Store 77 - Cửa hàng 0877851336",
        isActive: true,
      },
      {
        subdomain: "3700146514",
        databaseUrl:
          process.env.EXTERNAL_3700146514 || process.env.DATABASE_3700146514!,
        storeName: "Store 78 - Cửa hàng 3700146514",
        isActive: true,
      },
      {
        subdomain: "0313370295",
        databaseUrl:
          process.env.EXTERNAL_0313370295 || process.env.DATABASE_0313370295!,
        storeName: "Store 79 - Cửa hàng 0313370295",
        isActive: true,
      },
      {
        subdomain: "1602171903",
        databaseUrl:
          process.env.EXTERNAL_1602171903 || process.env.DATABASE_1602171903!,
        storeName: "Store 79 - Cửa hàng 1602171903",
        isActive: true,
      },
      // Add more tenants as needed
    ];

    tenantsConfig.forEach((config) => {
      this.tenants.set(config.subdomain, config);
    });
  }

  getTenantBySubdomain(subdomain: string): TenantConfig | null {
    return this.tenants.get(subdomain) || null;
  }

  async getDatabaseConnection(subdomain: string) {
    if (this.dbConnections.has(subdomain)) {
      return this.dbConnections.get(subdomain);
    }

    let tenant = this.getTenantBySubdomain(subdomain);
    if (!tenant) {
      tenant = this.getTenantBySubdomain("demo");
    }

    const pool = new Pool({
      connectionString: tenant.databaseUrl,
      max: 10,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
      acquireTimeoutMillis: 10000,
      ssl: tenant.databaseUrl?.includes("1.55.212.135")
        ? false // Disable SSL for external server
        : tenant.databaseUrl?.includes("neon")
          ? { rejectUnauthorized: false }
          : undefined,
    });

    const db = drizzle({ client: pool, schema });
    this.dbConnections.set(subdomain, db);

    return db;
  }

  getAllTenants(): TenantConfig[] {
    return Array.from(this.tenants.values());
  }

  addTenant(config: TenantConfig) {
    this.tenants.set(config.subdomain, config);
  }

  removeTenant(subdomain: string) {
    this.tenants.delete(subdomain);
    this.dbConnections.delete(subdomain);
  }
}

export const tenantManager = new TenantManager();
