// @ts-nocheck
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";
import {
  categories,
  products,
  employees,
  tables,
  orders,
  orderItems,
  transactions,
  transactionItems,
  attendanceRecords,
  storeSettings,
  suppliers,
  customers,
} from "../shared/schema";
import { sql } from "drizzle-orm";

// Load environment variables from .env file with higher priority
import { config } from "dotenv";
import path from "path";

// Load .env.local first, then override with .env to ensure .env has priority
config({ path: path.resolve(".env.local") });
config({ path: path.resolve(".env") });

// Multi-tenant database configuration
interface TenantConfig {
  subdomain: string;
  databaseUrl: string;
  storeName: string;
  isActive: boolean;
}

class DatabaseManager {
  private pools: Map<string, Pool> = new Map();
  private dbs: Map<string, any> = new Map();
  private defaultPool: Pool;
  private defaultDb: any;

  constructor() {
    // Initialize default database connection
    let DATABASE_URL = process.env.EXTERNAL_DB_URL || process.env.DATABASE_URL;

    if (!DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }

    // Ensure we're using the correct database and SSL settings for external server
    if (DATABASE_URL?.includes("1.55.212.135")) {
      if (!DATABASE_URL.includes("sslmode=disable")) {
        DATABASE_URL += DATABASE_URL.includes("?")
          ? "&sslmode=disable"
          : "?sslmode=disable";
      }
    }

    // Create default pool
    this.defaultPool = new Pool({
      connectionString: DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: DATABASE_URL?.includes("1.55.212.135")
        ? false // Disable SSL for external server
        : DATABASE_URL?.includes("neon")
          ? { rejectUnauthorized: false }
          : undefined,
    });

    this.defaultDb = drizzle(this.defaultPool, { schema });

    // Log database connection info
    console.log("🔍 Multi-tenant Database Manager initialized");
    console.log(
      "  - Default DATABASE_URL preview:",
      DATABASE_URL?.substring(0, 50) + "...",
    );

    // Test default database connection
    this.testDefaultConnection();

    // Initialize tenant databases
    this.initializeTenantDatabases();
  }

  private async testDefaultConnection() {
    try {
      const result = await this.defaultPool.query(
        "SELECT current_database(), current_user, version()",
      );
      console.log("✅ Default database connection successful:");
      console.log("  - Database:", result.rows[0]?.current_database);
      console.log("  - User:", result.rows[0]?.current_user);
      console.log(
        "  - Version:",
        result.rows[0]?.version?.substring(0, 50) + "...",
      );
    } catch (err) {
      console.error("❌ Default database connection failed:", err);
    }
  }

  private initializeTenantDatabases() {
    // Load tenant configurations
    const tenantConfigs: TenantConfig[] = [
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
          process.env.EXTERNAL_8464163489_001 ||
          process.env.DATABASE_8464163489_001!,
        storeName: "Store 56 - Cửa hàng 8464163489-001",
        isActive: true,
      },
      {
        subdomain: "049077013185",
        databaseUrl:
          process.env.EXTERNAL_049077013185 ||
          process.env.DATABASE_049077013185!,
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
        storeName: "Store 80 - Cửa hàng 1602171903",
        isActive: true,
      },
      {
        subdomain: "0963669492",
        databaseUrl:
          process.env.EXTERNAL_0963669492 || process.env.DATABASE_0963669492!,
        storeName: "Store 81 - Cửa hàng 0963669492",
        isActive: true,
      },
      {
        subdomain: "0945678855",
        databaseUrl:
          process.env.EXTERNAL_0945678855 || process.env.DATABASE_0945678855!,
        storeName: "Store 82 - Cửa hàng 0945678855",
        isActive: true,
      },
      {
        subdomain: "0107499920",
        databaseUrl:
          process.env.EXTERNAL_0107499920 || process.env.DATABASE_0107499920!,
        storeName: "Store 83 - Cửa hàng 0107499920",
        isActive: true,
      },
      {
        subdomain: "0313717187",
        databaseUrl:
          process.env.EXTERNAL_0313717187 || process.env.DATABASE_0313717187!,
        storeName: "Store 84 - Cửa hàng 0313717187",
        isActive: true,
      },
      {
        subdomain: "0339475314",
        databaseUrl:
          process.env.EXTERNAL_0339475314 || process.env.DATABASE_0339475314!,
        storeName: "Store 85 - Cửa hàng 0339475314",
        isActive: true,
      },
      {
        subdomain: "0334410478",
        databaseUrl:
          process.env.EXTERNAL_0334410478 || process.env.DATABASE_0334410478!,
        storeName: "Store 86 - Cửa hàng 0334410478",
        isActive: true,
      },
      {
        subdomain: "0938028056",
        databaseUrl:
          process.env.EXTERNAL_0938028056 || process.env.DATABASE_0938028056!,
        storeName: "Store 87 - Cửa hàng 0938028056",
        isActive: true,
      },
      {
        subdomain: "0981160602",
        databaseUrl:
          process.env.EXTERNAL_0981160602 || process.env.DATABASE_0981160602!,
        storeName: "Store 88 - Cửa hàng 0981160602",
        isActive: true,
      },
      {
        subdomain: "0866445806",
        databaseUrl:
          process.env.EXTERNAL_0866445806 || process.env.DATABASE_0866445806!,
        storeName: "Store 89 - Cửa hàng 0866445806",
        isActive: true,
      },
      {
        subdomain: "0982663686",
        databaseUrl:
          process.env.EXTERNAL_0982663686 || process.env.DATABASE_0982663686!,
        storeName: "Store 90 - Cửa hàng 0982663686",
        isActive: true,
      },
      {
        subdomain: "0975225994",
        databaseUrl:
          process.env.EXTERNAL_0975225994 || process.env.DATABASE_0975225994!,
        storeName: "Store 91 - Cửa hàng 0975225994",
        isActive: true,
      },
      {
        subdomain: "0909090134",
        databaseUrl:
          process.env.EXTERNAL_0909090134 || process.env.DATABASE_0909090134!,
        storeName: "Store 92 - Cửa hàng 0909090134",
        isActive: true,
      },
      {
        subdomain: "0939649894",
        databaseUrl:
          process.env.EXTERNAL_0939649894 || process.env.DATABASE_0939649894!,
        storeName: "Store 93 - Cửa hàng 0939649894",
        isActive: true,
      },
      {
        subdomain: "0353977295",
        databaseUrl:
          process.env.EXTERNAL_0353977295 || process.env.DATABASE_0353977295!,
        storeName: "Store 94 - Cửa hàng 0353977295",
        isActive: true,
      },
      {
        subdomain: "0988671121",
        databaseUrl:
          process.env.EXTERNAL_0988671121 || process.env.DATABASE_0988671121!,
        storeName: "Store 95 - Cửa hàng 0988671121",
        isActive: true,
      },
      {
        subdomain: "0986626264",
        databaseUrl:
          process.env.EXTERNAL_0986626264 || process.env.DATABASE_0986626264!,
        storeName: "Store 96 - Cửa hàng 0986626264",
        isActive: true,
      },
      {
        subdomain: "0905529792",
        databaseUrl:
          process.env.EXTERNAL_0905529792 || process.env.DATABASE_0905529792!,
        storeName: "Store 97 - Cửa hàng 0905529792",
        isActive: true,
      },
      {
        subdomain: "0379367857",
        databaseUrl:
          process.env.EXTERNAL_0379367857 || process.env.DATABASE_0379367857!,
        storeName: "Store 98 - Cửa hàng 0379367857",
        isActive: true,
      },
      {
        subdomain: "0932942643",
        databaseUrl:
          process.env.EXTERNAL_0932942643 || process.env.DATABASE_0932942643!,
        storeName: "Store 99 - Cửa hàng 0932942643",
        isActive: true,
      },
      {
        subdomain: "0986161577",
        databaseUrl:
          process.env.EXTERNAL_0986161577 || process.env.DATABASE_0986161577!,
        storeName: "Store 100 - Cửa hàng 0986161577",
        isActive: true,
      },
      {
        subdomain: "0981485488",
        databaseUrl:
          process.env.EXTERNAL_0981485488 || process.env.DATABASE_0981485488!,
        storeName: "Store 101 - Cửa hàng 0981485488",
        isActive: true,
      },
      {
        subdomain: "0966609066",
        databaseUrl:
          process.env.EXTERNAL_0966609066 || process.env.DATABASE_0966609066!,
        storeName: "Store 102 - Cửa hàng 0966609066",
        isActive: true,
      },
      {
        subdomain: "0986564449",
        databaseUrl:
          process.env.EXTERNAL_0986564449 || process.env.DATABASE_0986564449!,
        storeName: "Store 103 - Cửa hàng 0986564449",
        isActive: true,
      },
      {
        subdomain: "0968109164",
        databaseUrl:
          process.env.EXTERNAL_0968109164 || process.env.DATABASE_0968109164!,
        storeName: "Store 104 - Cửa hàng 0968109164",
        isActive: true,
      },
      {
        subdomain: "0844688022",
        databaseUrl:
          process.env.EXTERNAL_0844688022 || process.env.DATABASE_0844688022!,
        storeName: "Store 105 - Cửa hàng 0844688022",
        isActive: true,
      },
      {
        subdomain: "0342888789",
        databaseUrl:
          process.env.EXTERNAL_0342888789 || process.env.DATABASE_0342888789!,
        storeName: "Store 106 - Cửa hàng 0342888789",
        isActive: true,
      },
      {
        subdomain: "0886668152",
        databaseUrl:
          process.env.EXTERNAL_0886668152 || process.env.DATABASE_0886668152!,
        storeName: "Store 107 - Cửa hàng 0886668152",
        isActive: true,
      },
      {
        subdomain: "0818011991",
        databaseUrl:
          process.env.EXTERNAL_0818011991 || process.env.DATABASE_0818011991!,
        storeName: "Store 108 - Cửa hàng 0818011991",
        isActive: true,
      },
      {
        subdomain: "0777722779",
        databaseUrl:
          process.env.EXTERNAL_0777722779 || process.env.DATABASE_0777722779!,
        storeName: "Store 109 - Cửa hàng 0777722779",
        isActive: true,
      },
      {
        subdomain: "0786666695",
        databaseUrl:
          process.env.EXTERNAL_0786666695 || process.env.DATABASE_0786666695!,
        storeName: "Store 110 - Cửa hàng 0786666695",
        isActive: true,
      },
      {
        subdomain: "0982695694",
        databaseUrl:
          process.env.EXTERNAL_0982695694 || process.env.DATABASE_0982695694!,
        storeName: "Store 111 - Cửa hàng 0982695694",
        isActive: true,
      },
      {
        subdomain: "064082001010",
        databaseUrl:
          process.env.EXTERNAL_064082001010 || process.env.DATABASE_064082001010!,
        storeName: "Store 112 - Cửa hàng 064082001010",
        isActive: true,
      },
      {
        subdomain: "0344746136",
        databaseUrl:
          process.env.EXTERNAL_0344746136 || process.env.DATABASE_0344746136!,
        storeName: "Store 113 - Cửa hàng 0344746136",
        isActive: true,
      },
      {
        subdomain: "0968866674",
        databaseUrl:
          process.env.EXTERNAL_0968866674 || process.env.DATABASE_0968866674!,
        storeName: "Store 114 - Cửa hàng 0968866674",
        isActive: true,
      },
      {
        subdomain: "0971478861",
        databaseUrl:
          process.env.EXTERNAL_0971478861 || process.env.DATABASE_0971478861!,
        storeName: "Store 115 - Cửa hàng 0971478861",
        isActive: true,
      },
      {
        subdomain: "0963528038",
        databaseUrl:
          process.env.EXTERNAL_0963528038 || process.env.DATABASE_0963528038!,
        storeName: "Store 116 - Cửa hàng 0963528038",
        isActive: true,
      },
      {
        subdomain: "0832296479",
        databaseUrl:
          process.env.EXTERNAL_0832296479 || process.env.DATABASE_0832296479!,
        storeName: "Store 117 - Cửa hàng 0832296479",
        isActive: true,
      },
      {
        subdomain: "0982008115",
        databaseUrl:
          process.env.EXTERNAL_0982008115 || process.env.DATABASE_0982008115!,
        storeName: "Store 118 - Cửa hàng 0982008115",
        isActive: true,
      },
      {
        subdomain: "0388650731",
        databaseUrl:
          process.env.EXTERNAL_0388650731 || process.env.DATABASE_0388650731!,
        storeName: "Store 119 - Cửa hàng 0388650731",
        isActive: true,
      },
      {
        subdomain: "0766447077",
        databaseUrl:
          process.env.EXTERNAL_0766447077 || process.env.DATABASE_0766447077!,
        storeName: "Store 120 - Cửa hàng 0766447077",
        isActive: true,
      },
      {
        subdomain: "0933671386",
        databaseUrl:
          process.env.EXTERNAL_0933671386 || process.env.DATABASE_0933671386!,
        storeName: "Store 121 - Cửa hàng 0933671386",
        isActive: true,
      },
      {
        subdomain: "0986018061",
        databaseUrl:
          process.env.EXTERNAL_0986018061 || process.env.DATABASE_0986018061!,
        storeName: "Store 122 - Cửa hàng 0986018061",
        isActive: true,
      },
      {
        subdomain: "0969056505",
        databaseUrl:
          process.env.EXTERNAL_0969056505 || process.env.DATABASE_0969056505!,
        storeName: "Store 123 - Cửa hàng 0969056505",
        isActive: true,
      },
      {
        subdomain: "0368132668",
        databaseUrl:
          process.env.EXTERNAL_0368132668 || process.env.DATABASE_0368132668!,
        storeName: "Store 124 - Cửa hàng 0368132668",
        isActive: true,
      },
      {
        subdomain: "0934343238",
        databaseUrl:
          process.env.EXTERNAL_0934343238 || process.env.DATABASE_0934343238!,
        storeName: "Store 125 - Cửa hàng 0934343238",
        isActive: true,
      },
      {
        subdomain: "0936828627",
        databaseUrl:
          process.env.EXTERNAL_0936828627 || process.env.DATABASE_0936828627!,
        storeName: "Store 126 - Cửa hàng 0936828627",
        isActive: true,
      },
      {
        subdomain: "0932654571",
        databaseUrl:
          process.env.EXTERNAL_0932654571 || process.env.DATABASE_0932654571!,
        storeName: "Store 127 - Cửa hàng 0932654571",
        isActive: true,
      },
    ];
    // Initialize each tenant database
    tenantConfigs.forEach((config) => {
      try {
        this.createTenantConnection(config.subdomain, config.databaseUrl);
        console.log(
          `✅ Tenant database initialized: ${config.subdomain} (${config.storeName})`,
        );
      } catch (error) {
        console.error(
          `❌ Failed to initialize tenant database: ${config.subdomain}`,
          error,
        );
      }
    });
  }

  private createTenantConnection(subdomain: string, databaseUrl: string) {
    // Ensure SSL settings for external server
    let finalDatabaseUrl = databaseUrl;
    if (finalDatabaseUrl?.includes("1.55.212.135")) {
      if (!finalDatabaseUrl.includes("sslmode=disable")) {
        finalDatabaseUrl += finalDatabaseUrl.includes("?")
          ? "&sslmode=disable"
          : "?sslmode=disable";
      }
    }

    const pool = new Pool({
      connectionString: finalDatabaseUrl,
      max: 10,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
      acquireTimeoutMillis: 10000,
      ssl: finalDatabaseUrl?.includes("1.55.212.135")
        ? false // Disable SSL for external server
        : finalDatabaseUrl?.includes("neon")
          ? { rejectUnauthorized: false }
          : undefined,
    });

    const db = drizzle(pool, { schema });

    this.pools.set(subdomain, pool);
    this.dbs.set(subdomain, db);

    return { pool, db };
  }

  // Get database connection for a specific tenant
  getTenantDatabase(subdomain: string) {
    const tenantDb = this.dbs.get(subdomain);
    if (!tenantDb) {
      console.warn(
        `⚠️ Tenant database not found for subdomain: ${subdomain}, using default`,
      );
      return this.defaultDb;
    }
    return tenantDb;
  }

  // Get pool for a specific tenant
  getTenantPool(subdomain: string) {
    const tenantPool = this.pools.get(subdomain);
    if (!tenantPool) {
      console.warn(
        `⚠️ Tenant pool not found for subdomain: ${subdomain}, using default`,
      );
      return this.defaultPool;
    }
    return tenantPool;
  }

  // Get default database (for backward compatibility)
  getDefaultDatabase() {
    return this.defaultDb;
  }

  // Get default pool (for backward compatibility)
  getDefaultPool() {
    return this.defaultPool;
  }

  // Add new tenant database at runtime
  async addTenantDatabase(subdomain: string, databaseUrl: string) {
    try {
      this.createTenantConnection(subdomain, databaseUrl);
      console.log(`✅ New tenant database added: ${subdomain}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to add tenant database: ${subdomain}`, error);
      return false;
    }
  }

  // Remove tenant database
  async removeTenantDatabase(subdomain: string) {
    try {
      const pool = this.pools.get(subdomain);
      if (pool) {
        await pool.end();
        this.pools.delete(subdomain);
        this.dbs.delete(subdomain);
        console.log(`✅ Tenant database removed: ${subdomain}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Failed to remove tenant database: ${subdomain}`, error);
      return false;
    }
  }

  // Get all tenant subdomains
  getAllTenants() {
    return Array.from(this.dbs.keys());
  }

  // Health check for all databases
  async healthCheck() {
    const results = { default: false, tenants: {} as Record<string, boolean> };

    // Check default database
    try {
      await this.defaultPool.query("SELECT 1");
      results.default = true;
    } catch (error) {
      console.error("❌ Default database health check failed:", error);
    }

    // Check tenant databases
    for (const [subdomain, pool] of this.pools.entries()) {
      try {
        await pool.query("SELECT 1");
        results.tenants[subdomain] = true;
      } catch (error) {
        console.error(
          `❌ Tenant database health check failed for ${subdomain}:`,
          error,
        );
        results.tenants[subdomain] = false;
      }
    }

    return results;
  }
}

// Create global database manager instance
const dbManager = new DatabaseManager();

// Export default connections for backward compatibility
export const pool = dbManager.getDefaultPool();
export const db = dbManager.getDefaultDatabase();

// Export database manager for advanced usage
export { dbManager };

// Helper function to get tenant database
export function getTenantDatabase(subdomain: string) {
  return dbManager.getTenantDatabase(subdomain);
}

// Helper function to get tenant pool
export function getTenantPool(subdomain: string) {
  return dbManager.getTenantPool(subdomain);
}

// Function to check and add missing columns from schema
export async function checkAndAddMissingColumns() {
  console.log("🔍 Checking for missing columns in database...");

  // Define schema structure with table name, column name, type, and default
  const schemaColumns = [
    // Categories table
    {
      table: "categories",
      column: "name",
      type: "TEXT NOT NULL",
      default: "''",
      index: null,
    },
    {
      table: "categories",
      column: "icon",
      type: "TEXT NOT NULL",
      default: "'fa-folder'",
      index: null,
    },
    {
      table: "categories",
      column: "store_code",
      type: "VARCHAR(50)",
      default: null,
      index: "idx_categories_store_code",
    },

    // Products table
    {
      table: "products",
      column: "name",
      type: "TEXT NOT NULL",
      default: "''",
      index: null,
    },
    {
      table: "products",
      column: "sku",
      type: "TEXT",
      default: null,
      index: "idx_products_sku",
    },
    {
      table: "products",
      column: "price",
      type: "DECIMAL(18,2) NOT NULL",
      default: "0.00",
      index: null,
    },
    {
      table: "products",
      column: "stock",
      type: "INTEGER NOT NULL",
      default: "0",
      index: null,
    },
    {
      table: "products",
      column: "category_id",
      type: "INTEGER",
      default: null,
      index: "idx_products_category_id",
    },
    {
      table: "products",
      column: "image_url",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "products",
      column: "is_active",
      type: "BOOLEAN NOT NULL",
      default: "true",
      index: "idx_products_is_active",
    },
    {
      table: "products",
      column: "product_type",
      type: "INTEGER NOT NULL",
      default: "1",
      index: null,
    },
    {
      table: "products",
      column: "track_inventory",
      type: "BOOLEAN NOT NULL",
      default: "true",
      index: null,
    },
    {
      table: "products",
      column: "tax_rate",
      type: "DECIMAL(5,2) NOT NULL",
      default: "0.00",
      index: null,
    },
    {
      table: "products",
      column: "tax_rate_name",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "products",
      column: "price_includes_tax",
      type: "BOOLEAN NOT NULL",
      default: "false",
      index: null,
    },
    {
      table: "products",
      column: "after_tax_price",
      type: "DECIMAL(18,2)",
      default: null,
      index: null,
    },
    {
      table: "products",
      column: "before_tax_price",
      type: "DECIMAL(18,2)",
      default: null,
      index: "idx_products_before_tax_price",
    },
    {
      table: "products",
      column: "floor",
      type: "VARCHAR(50)",
      default: "'1'",
      index: "idx_products_floor",
    },
    {
      table: "products",
      column: "zone",
      type: "VARCHAR(50)",
      default: "'A'",
      index: "idx_products_zone",
    },
    {
      table: "products",
      column: "unit",
      type: "TEXT",
      default: "'Cái'",
      index: null,
    },
    {
      table: "products",
      column: "is_active",
      type: "BOOLEAN NOT NULL",
      default: "true",
      index: "idx_products_is_active",
    },
    {
      table: "products",
      column: "store_code",
      type: "VARCHAR(50)",
      default: null,
      index: "idx_products_store_code",
    },
    {
      table: "products",
      column: "sort",
      type: "INTEGER",
      default: "0",
      index: null,
    },

    // Store settings table
    {
      table: "store_settings",
      column: "store_name",
      type: "TEXT NOT NULL",
      default: "'EDPOS 레스토랑'",
      index: null,
    },
    {
      table: "store_settings",
      column: "store_code",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "store_settings",
      column: "domain",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "store_settings",
      column: "tax_id",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "store_settings",
      column: "price_list_id",
      type: "INTEGER",
      default: null,
      index: "idx_store_settings_price_list_id",
    },
    {
      table: "store_settings",
      column: "business_type",
      type: "TEXT",
      default: "'restaurant'",
      index: null,
    },
    {
      table: "store_settings",
      column: "pin_code",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "store_settings",
      column: "user_name",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "store_settings",
      column: "password",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "store_settings",
      column: "is_admin",
      type: "BOOLEAN",
      default: "false",
      index: null,
    },
    {
      table: "store_settings",
      column: "parent",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "store_settings",
      column: "type_user",
      type: "INTEGER",
      default: "0",
      index: null,
    },
    {
      table: "store_settings",
      column: "address",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "store_settings",
      column: "phone",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "store_settings",
      column: "email",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "store_settings",
      column: "open_time",
      type: "TEXT",
      default: "'09:00'",
      index: null,
    },
    {
      table: "store_settings",
      column: "close_time",
      type: "TEXT",
      default: "'22:00'",
      index: null,
    },
    {
      table: "store_settings",
      column: "gold_threshold",
      type: "TEXT",
      default: "'300000'",
      index: null,
    },
    {
      table: "store_settings",
      column: "vip_threshold",
      type: "TEXT",
      default: "'1000000'",
      index: null,
    },
    {
      table: "store_settings",
      column: "price_includes_tax",
      type: "BOOLEAN",
      default: "false",
      index: null,
    },
    {
      table: "store_settings",
      column: "default_floor",
      type: "TEXT",
      default: "'1'",
      index: null,
    },
    {
      table: "store_settings",
      column: "default_zone",
      type: "TEXT",
      default: "'A'",
      index: null,
    },
    {
      table: "store_settings",
      column: "floor_prefix",
      type: "TEXT",
      default: "'층'",
      index: null,
    },
    {
      table: "store_settings",
      column: "zone_prefix",
      type: "TEXT",
      default: "'구역'",
      index: null,
    },
    {
      table: "store_settings",
      column: "is_edit",
      type: "BOOLEAN NOT NULL",
      default: "false",
      index: null,
    },
    {
      table: "store_settings",
      column: "is_cancelled",
      type: "BOOLEAN NOT NULL",
      default: "false",
      index: null,
    },
    {
      table: "store_settings",
      column: "created_at",
      type: "TIMESTAMPTZ",
      default: "NOW()",
      index: null,
    },
    {
      table: "store_settings",
      column: "updated_at",
      type: "TIMESTAMPTZ",
      default: "NOW()",
      index: null,
    },

    // Orders table
    {
      table: "orders",
      column: "order_number",
      type: "TEXT",
      default: null,
      index: "idx_orders_order_number",
    },
    {
      table: "orders",
      column: "table_id",
      type: "INTEGER",
      default: null,
      index: "idx_orders_table_id",
    },
    {
      table: "orders",
      column: "employee_id",
      type: "INTEGER",
      default: null,
      index: null,
    },
    {
      table: "orders",
      column: "customer_id",
      type: "INTEGER",
      default: null,
      index: "idx_orders_customer_id",
    },
    {
      table: "orders",
      column: "status",
      type: "TEXT NOT NULL",
      default: "'pending'",
      index: "idx_orders_status",
    },
    {
      table: "orders",
      column: "customer_name",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "orders",
      column: "customer_phone",
      type: "TEXT",
      default: null,
      index: "idx_orders_customer_phone",
    },
    {
      table: "orders",
      column: "customer_tax_code",
      type: "TEXT",
      default: null,
      index: "idx_orders_customer_tax_code",
    },
    {
      table: "orders",
      column: "customer_count",
      type: "INTEGER",
      default: "1",
      index: null,
    },
    {
      table: "orders",
      column: "subtotal",
      type: "DECIMAL(10,2) NOT NULL",
      default: "0.00",
      index: null,
    },
    {
      table: "orders",
      column: "tax",
      type: "DECIMAL(10,2) NOT NULL",
      default: "0.00",
      index: null,
    },
    {
      table: "orders",
      column: "discount",
      type: "DECIMAL(10,2) NOT NULL",
      default: "0.00",
      index: "idx_orders_discount",
    },
    {
      table: "orders",
      column: "total",
      type: "DECIMAL(10,2) NOT NULL",
      default: "0.00",
      index: null,
    },
    {
      table: "orders",
      column: "payment_method",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "orders",
      column: "payment_status",
      type: "TEXT NOT NULL",
      default: "'pending'",
      index: null,
    },
    {
      table: "orders",
      column: "is_paid",
      type: "BOOLEAN NOT NULL",
      default: "false",
      index: "idx_orders_is_paid",
    },
    {
      table: "orders",
      column: "einvoice_status",
      type: "INTEGER NOT NULL",
      default: "0",
      index: null,
    },
    {
      table: "orders",
      column: "template_number",
      type: "VARCHAR(50)",
      default: null,
      index: "idx_orders_template_number",
    },
    {
      table: "orders",
      column: "symbol",
      type: "VARCHAR(20)",
      default: null,
      index: "idx_orders_symbol",
    },
    {
      table: "orders",
      column: "invoice_number",
      type: "VARCHAR(50)",
      default: null,
      index: "idx_orders_invoice_number",
    },
    {
      table: "orders",
      column: "sales_channel",
      type: "TEXT NOT NULL",
      default: "'table'",
      index: "idx_orders_sales_channel",
    },
    {
      table: "orders",
      column: "price_include_tax",
      type: "BOOLEAN NOT NULL",
      default: "false",
      index: "idx_orders_price_include_tax",
    },
    {
      table: "orders",
      column: "notes",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "orders",
      column: "store_code",
      type: "VARCHAR(50)",
      default: null,
      index: "idx_orders_store_code",
    },
    {
      table: "orders",
      column: "ordered_at",
      type: "TIMESTAMPTZ",
      default: "NOW()",
      index: null,
    },
    {
      table: "orders",
      column: "served_at",
      type: "TIMESTAMPTZ",
      default: null,
      index: null,
    },
    {
      table: "orders",
      column: "paid_at",
      type: "TIMESTAMPTZ",
      default: null,
      index: null,
    },
    {
      table: "orders",
      column: "created_at",
      type: "TIMESTAMPTZ",
      default: "NOW()",
      index: null,
    },
    {
      table: "orders",
      column: "updated_at",
      type: "TIMESTAMPTZ",
      default: "NOW()",
      index: null,
    },

    // Order items table
    {
      table: "order_items",
      column: "order_id",
      type: "INTEGER",
      default: null,
      index: null,
    },
    {
      table: "order_items",
      column: "product_id",
      type: "INTEGER",
      default: null,
      index: null,
    },
    {
      table: "order_items",
      column: "quantity",
      type: "NUMERIC(8,4) NOT NULL",
      default: "1",
      index: null,
    },
    {
      table: "order_items",
      column: "unit_price",
      type: "DECIMAL(10,2) NOT NULL",
      default: "0.00",
      index: null,
    },
    {
      table: "order_items",
      column: "total",
      type: "DECIMAL(10,2) NOT NULL",
      default: "0.00",
      index: null,
    },
    {
      table: "order_items",
      column: "discount",
      type: "DECIMAL(10,2) NOT NULL",
      default: "0.00",
      index: "idx_order_items_discount",
    },
    {
      table: "order_items",
      column: "tax",
      type: "DECIMAL(10,2) NOT NULL",
      default: "0.00",
      index: "idx_order_items_tax",
    },
    {
      table: "order_items",
      column: "price_before_tax",
      type: "DECIMAL(10,2) NOT NULL",
      default: "0.00",
      index: "idx_order_items_price_before_tax",
    },
    {
      table: "order_items",
      column: "status",
      type: "VARCHAR(50) NOT NULL",
      default: "'pending'",
      index: "idx_order_items_status",
    },
    {
      table: "order_items",
      column: "notes",
      type: "TEXT",
      default: null,
      index: null,
    },
    {
      table: "order_items",
      column: "store_code",
      type: "VARCHAR(50)",
      default: null,
      index: "idx_order_items_store_code",
    },
  ];

  let addedColumns = 0;
  let createdIndexes = 0;

  for (const {
    table,
    column,
    type,
    default: defaultValue,
    index,
  } of schemaColumns) {
    try {
      // Check if column exists
      const checkColumn = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${table}
        AND column_name = ${column}
      `);

      if (!checkColumn.rows || checkColumn.rows.length === 0) {
        // Column doesn't exist, add it
        const alterQuery = defaultValue
          ? `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type} DEFAULT ${defaultValue}`
          : `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type}`;

        await db.execute(sql.raw(alterQuery));
        console.log(`  ✅ Added column ${table}.${column}`);
        addedColumns++;
      }

      // Create index if specified and doesn't exist
      if (index) {
        const checkIndex = await db.execute(sql`
          SELECT indexname 
          FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND tablename = ${table}
          AND indexname = ${index}
        `);

        if (!checkIndex.rows || checkIndex.rows.length === 0) {
          await db.execute(
            sql.raw(
              `CREATE INDEX IF NOT EXISTS ${index} ON ${table}(${column})`,
            ),
          );
          console.log(`  📊 Created index ${index} on ${table}.${column}`);
          createdIndexes++;
        }
      }
    } catch (error) {
      console.log(
        `  ⚠️ Error checking/adding ${table}.${column}:`,
        error.message,
      );
    }
  }

  console.log(
    `\n✅ Column check completed: ${addedColumns} columns added, ${createdIndexes} indexes created\n`,
  );
}

// Initialize sample data function
export async function initializeSampleData() {
  try {
    console.log("Running database migrations...");

    // Run the automatic column check first
    await checkAndAddMissingColumns();

    // Run migration for membership thresholds
    try {
      await db.execute(sql`
        ALTER TABLE store_settings 
        ADD COLUMN IF NOT EXISTS gold_threshold TEXT DEFAULT '300000'
      `);
      await db.execute(sql`
        ALTER TABLE store_settings 
        ADD COLUMN IF NOT EXISTS vip_threshold TEXT DEFAULT '1000000'
      `);

      // Update existing records
      await db.execute(sql`
        UPDATE store_settings 
        SET gold_threshold = COALESCE(gold_threshold, '300000'), 
            vip_threshold = COALESCE(vip_threshold, '1000000')
      `);

      console.log(
        "Migration for membership thresholds completed successfully.",
      );
    } catch (migrationError) {
      console.log("Migration already applied or error:", migrationError);
    }

    // Run migration for product_type column
    try {
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type INTEGER DEFAULT 1
      `);
      await db.execute(sql`
        UPDATE products SET product_type = 1 WHERE product_type IS NULL
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type)
      `);

      console.log("Migration for product_type column completed successfully.");
    } catch (migrationError) {
      console.log(
        "Product type migration already applied or error:",
        migrationError,
      );
    }

    // Run migration for tax_rate column
    try {
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0.00
      `);
      await db.execute(sql`
        UPDATE products SET tax_rate = 0.00 WHERE tax_rate IS NULL
      `);

      console.log("Migration for tax_rate column completed successfully.");
    } catch (migrationError) {
      console.log(
        "Tax rate migration already applied or error:",
        migrationError,
      );
    }

    // Run migration for price_includes_tax column
    try {
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS price_includes_tax BOOLEAN DEFAULT false
      `);
      await db.execute(sql`
        UPDATE products SET price_includes_tax = false WHERE price_includes_tax IS NULL
      `);

      console.log(
        "Migration for price_includes_tax column completed successfully.",
      );
    } catch (migrationError) {
      console.log(
        "Price includes tax migration already applied or error:",
        migrationError,
      );
    }

    // Run migration for after_tax_price column
    try {
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS after_tax_price DECIMAL(10,2)
      `);

      console.log(
        "Migration for after_tax_price column completed successfully.",
      );
    } catch (migrationError) {
      console.log(
        "After tax price migration already applied or error:",
        migrationError,
      );
    }

    // Run migration for pinCode column in store_settings
    try {
      await db.execute(sql`
        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS pin_code TEXT
      `);

      console.log("Migration for pinCode column completed successfully.");
    } catch (migrationError) {
      console.log(
        "PinCode migration already applied or error:",
        migrationError,
      );
    }

    // Add templateCode column to invoice_templates table
    try {
      await db.execute(sql`
        ALTER TABLE invoice_templates 
        ADD COLUMN IF NOT EXISTS template_code VARCHAR(50)
      `);
      console.log("Migration for templateCode column completed successfully.");
    } catch (error) {
      console.log(
        "TemplateCode migration failed or column already exists:",
        error,
      );
    }

    // Add trade_number column to invoices table and migrate data
    try {
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS trade_number VARCHAR(50)
      `);

      // Copy data from invoice_number to trade_number
      await db.execute(sql`
        UPDATE invoices SET trade_number = invoice_number WHERE trade_number IS NULL OR trade_number = ''
      `);

      // Clear invoice_number column
      await db.execute(sql`
        UPDATE invoices SET invoice_number = NULL
      `);

      // Create index for trade_number
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_invoices_trade_number ON invoices(trade_number)
      `);

      console.log("Migration for trade_number column completed successfully.");
    } catch (error) {
      console.log("Trade number migration failed or already applied:", error);
    }

    // Add invoice_status column to invoices table
    try {
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_status INTEGER NOT NULL DEFAULT 1
      `);

      // Create index for invoice_status
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_invoices_invoice_status ON invoices(invoice_status)
      `);

      console.log(
        "Migration for invoice_status column in invoices completed successfully.",
      );
    } catch (error) {
      console.log(
        "Invoice status migration for invoices failed or already applied:",
        error,
      );
    }

    // Add invoice_status column to orders table
    try {
      await db.execute(sql`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_status INTEGER NOT NULL DEFAULT 1
      `);

      // Create index for invoice_status
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_orders_invoice_status ON orders(invoice_status)
      `);

      console.log(
        "Migration for invoice_status column in orders completed successfully.",
      );
    } catch (error) {
      console.log(
        "Invoice status migration for orders failed or already applied:",
        error,
      );
    }

    // Add template_number and symbol columns to orders table
    try {
      await db.execute(sql`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS template_number VARCHAR(50)
      `);
      await db.execute(sql`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS symbol VARCHAR(20)
      `);

      // Create indexes for template_number and symbol
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_orders_template_number ON orders(template_number)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol)
      `);

      console.log(
        "Migration for template_number and symbol columns in orders table completed successfully.",
      );
    } catch (error) {
      console.log(
        "Template number and symbol migration failed or already applied:",
        error,
      );
    }

    // Add invoice_number column to orders table
    try {
      await db.execute(sql`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50)
      `);

      // Create index for invoice_number
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON orders(invoice_number)
      `);

      console.log(
        "Migration for invoice_number column in orders table completed successfully.",
      );
    } catch (error) {
      console.log("Invoice number migration failed or already applied:", error);
    }

    // Add discount column to orders table
    try {
      await db.execute(sql`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);

      // Create index for discount
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_orders_discount ON orders(discount)
      `);

      // Update existing orders to set discount to 0 if null
      await db.execute(sql`
        UPDATE orders SET discount = 0.00 WHERE discount IS NULL
      `);

      console.log(
        "Migration for discount column in orders table completed successfully.",
      );
    } catch (error) {
      console.log(
        "Discount column migration failed or already applied:",
        error,
      );
    }

    // Add discount column to order_items table
    try {
      await db.execute(sql`
        ALTER TABLE order_items ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);

      // Create index for discount
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_order_items_discount ON order_items(discount)
      `);

      // Update existing order items to set discount to 0 if null
      await db.execute(sql`
        UPDATE order_items SET discount = 0.00 WHERE discount IS NULL
      `);

      console.log(
        "Migration for discount column in order_items table completed successfully.",
      );
    } catch (error) {
      console.log(
        "Order items discount column migration failed or already applied:",
        error,
      );
    }

    // Add status column to order_items table
    try {
      await db.execute(sql`
        ALTER TABLE order_items ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'pending'
      `);

      // Create index for status
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status)
      `);

      // Update existing order items to set status to pending if null
      await db.execute(sql`
        UPDATE order_items SET status = 'pending' WHERE status IS NULL
      `);

      console.log(
        "Migration for status column in order_items table completed successfully.",
      );
    } catch (error) {
      console.log(
        "Order items status column migration failed or already applied:",
        error,
      );
    }

    // Add tax column to order_items table
    try {
      await db.execute(sql`
        ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);

      // Create index for tax
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_order_items_tax ON order_items(tax)
      `);

      // Update existing order items to set tax to 0 if null
      await db.execute(sql`
        UPDATE order_items SET tax = 0.00 WHERE tax IS NULL
      `);

      console.log(
        "Migration for tax column in order_items table completed successfully.",
      );
    } catch (error) {
      console.log(
        "Order items tax column migration failed or already applied:",
        error,
      );
    }

    // Add priceBeforeTax column to order_items table
    try {
      await db.execute(sql`
        ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price_before_tax DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);

      // Create index for priceBeforeTax
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_order_items_price_before_tax ON order_items(price_before_tax)
      `);

      // Update existing order items to set priceBeforeTax to 0 if null
      await db.execute(sql`
        UPDATE order_items SET price_before_tax = 0.00 WHERE price_before_tax IS NULL
      `);

      console.log(
        "Migration for price_before_tax column in order_items table completed successfully.",
      );
    } catch (error) {
      console.log(
        "Order items price_before_tax column migration failed or already applied:",
        error,
      );
    }

    // Update quantity column in order_items table to NUMERIC(8,4)
    try {
      await db.execute(sql`
        ALTER TABLE order_items 
        ALTER COLUMN quantity TYPE NUMERIC(8,4)
      `);

      console.log(
        "Migration for quantity column in order_items table to NUMERIC(8,4) completed successfully.",
      );
    } catch (error) {
      console.log(
        "Order items quantity column migration failed or already applied:",
        error,
      );
    }

    // Add price_include_tax column to orders table
    try {
      await db.execute(sql`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS price_include_tax BOOLEAN NOT NULL DEFAULT false
      `);

      // Create index for price_include_tax
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_orders_price_include_tax ON orders(price_include_tax)
      `);

      // Update existing orders to set price_include_tax based on store_settings
      await db.execute(sql`
        UPDATE orders 
        SET price_include_tax = (
          SELECT COALESCE(price_includes_tax, false) 
          FROM store_settings 
          LIMIT 1
        ) 
        WHERE price_include_tax IS NULL OR price_include_tax = false
      `);

      console.log(
        "Migration for price_include_tax column in orders table completed successfully.",
      );
    } catch (error) {
      console.log(
        "Orders price_include_tax column migration failed or already applied:",
        error,
      );
    }

    // Add before_tax_price column to products table
    try {
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS before_tax_price DECIMAL(18,2)
      `);

      // Create index for before_tax_price
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_products_before_tax_price ON products(before_tax_price)
      `);

      console.log(
        "Migration for before_tax_price column in products table completed successfully.",
      );
    } catch (error) {
      console.log(
        "Products before_tax_price column migration failed or already applied:",
        error,
      );
    }

    // Add tax_rate_name column to products table
    try {
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate_name TEXT
      `);

      // Update existing products with tax_rate_name based on their tax_rate
      await db.execute(sql`
        UPDATE products 
        SET tax_rate_name = CASE 
          WHEN tax_rate = '0' OR tax_rate IS NULL THEN '0%'
          WHEN tax_rate::numeric = 0 THEN '0%'
          ELSE tax_rate || '%'
        END
        WHERE tax_rate_name IS NULL
      `);

      console.log(
        "Migration for tax_rate_name column in products table completed successfully.",
      );
    } catch (error) {
      console.log(
        "Products tax_rate_name column migration failed or already applied:",
        error,
      );
    }

    // Ensure floor column exists in products
    try {
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS floor VARCHAR(50) DEFAULT '1층'
      `);

      // Update existing products
      await db.execute(sql`
        UPDATE products SET floor = '1층' WHERE floor IS NULL
      `);
      console.log("✅ Floor column added to products successfully");
    } catch (error) {
      console.log(
        "ℹ️ Floor column already exists or migration completed:",
        error.message,
      );
    }

    // Ensure zone column exists in products
    try {
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS zone VARCHAR(50) DEFAULT 'A구역'
      `);

      // Update existing products
      await db.execute(sql`
        UPDATE products SET zone = 'A구역' WHERE zone IS NULL
      `);
      console.log("✅ Zone column added to products successfully");
    } catch (error) {
      console.log(
        "ℹ️ Zone column already exists or migration completed:",
        error.message,
      );
    }

    // Ensure unit column exists in products
    try {
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'Cái'
      `);

      // Update existing products to have default unit if NULL
      await db.execute(sql`
        UPDATE products SET unit = 'Cái' WHERE unit IS NULL
      `);
      console.log("✅ Unit column added to products successfully");
    } catch (error) {
      console.log(
        "ℹ️ Unit column already exists or migration completed:",
        error.message,
      );
    }

    // Add isActive column to products table if it doesn't exist
    try {
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
      `);

      // Create index for better query performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)
      `);

      // Update existing products to set is_active to true if null
      await db.execute(sql`
        UPDATE products SET is_active = true WHERE is_active IS NULL
      `);
      console.log("✅ isActive column added to products successfully");
    } catch (error) {
      console.log(
        "ℹ️ isActive column already exists or migration completed:",
        error.message,
      );
    }

    // Initialize order_change_history table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS order_change_history (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          order_number VARCHAR(100),
          changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          ip_address VARCHAR(255) NOT NULL,
          user_id INTEGER,
          user_name VARCHAR(255) NOT NULL,
          action VARCHAR(50) NOT NULL DEFAULT 'edit',
          detailed_description TEXT NOT NULL,
          store_code VARCHAR(50),
          store_name VARCHAR(255),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // Ensure order_number column exists (migration for existing tables)
      await db.execute(sql`
        ALTER TABLE order_change_history 
        ADD COLUMN IF NOT EXISTS order_number VARCHAR(100)
      `);

      // Ensure store_name column exists (migration for existing tables)
      await db.execute(sql`
        ALTER TABLE order_change_history 
        ADD COLUMN IF NOT EXISTS store_name VARCHAR(255)
      `);

      // Add isEdit and isCancelled columns to store_settings
      try {
        await db.execute(sql`
          ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS is_edit BOOLEAN NOT NULL DEFAULT false
        `);
        await db.execute(sql`
          ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN NOT NULL DEFAULT false
        `);

        // Update existing records to have default values
        await db.execute(sql`
          UPDATE store_settings 
          SET is_edit = COALESCE(is_edit, false),
              is_cancelled = COALESCE(is_cancelled, false)
          WHERE is_edit IS NULL OR is_cancelled IS NULL
        `);

        console.log(
          "✅ isEdit and isCancelled columns added to store_settings successfully",
        );
      } catch (error) {
        console.log(
          "ℹ️ isEdit and isCancelled columns already exist or migration completed:",
          error.message,
        );
      }

      // Create indexes for better performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_order_change_history_order_id ON order_change_history(order_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_order_change_history_changed_at ON order_change_history(changed_at)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_order_change_history_store_code ON order_change_history(store_code)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_order_change_history_order_number ON order_change_history(order_number)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_order_change_history_store_name ON order_change_history(store_name)
      `);

      console.log("✅ Order change history table initialized successfully");
    } catch (error) {
      console.log(
        "ℹ️ Order change history table already exists or initialization failed:",
        error,
      );
    }

    // Add customer phone and tax code to orders table
    try {
      await db.execute(sql`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT
      `);
      await db.execute(sql`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_tax_code TEXT
      `);

      // Create indexes for better search performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_orders_customer_tax_code ON orders(customer_tax_code)
      `);

      console.log(
        "✅ Customer phone and tax code columns added to orders successfully",
      );
    } catch (error) {
      console.log(
        "ℹ️ Customer info columns already exist or migration completed:",
        error.message,
      );
    }

    // Add customerId to orders table
    try {
      await db.execute(sql`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id)
      `);

      // Create index for better query performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)
      `);

      // Update existing orders to link with customers based on phone number
      await db.execute(sql`
        UPDATE orders o
        SET customer_id = c.id
        FROM customers c
        WHERE o.customer_phone IS NOT NULL 
          AND c.phone IS NOT NULL
          AND o.customer_phone = c.phone
          AND o.customer_id IS NULL
      `);

      console.log("✅ customerId column added to orders table successfully");
    } catch (error) {
      console.log(
        "ℹ️ customerId column already exists or migration completed:",
        error.message,
      );
    }

    // Add customer phone and tax code to orders table
    try {
      await db.execute(sql`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT
      `);
      await db.execute(sql`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_tax_code TEXT
      `);

      // Create indexes for better search performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_orders_customer_tax_code ON orders(customer_tax_code)
      `);

      console.log(
        "✅ Customer phone and tax code columns added to orders successfully",
      );
    } catch (error) {
      console.log(
        "ℹ️ Customer info columns already exist or migration completed:",
        error.message,
      );
    }

    // Add domain column to store_settings
    try {
      await db.execute(sql`
        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS domain TEXT
      `);

      console.log("✅ Domain column added to store_settings successfully");
    } catch (error) {
      console.log(
        "ℹ️ Domain column already exists or migration completed:",
        error.message,
      );
    }

    // Add isEdit and isCancelled columns to store_settings
    try {
      await db.execute(sql`
        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS is_edit BOOLEAN NOT NULL DEFAULT false
      `);
      await db.execute(sql`
        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN NOT NULL DEFAULT false
      `);

      // Update existing records to have default values
      await db.execute(sql`
        UPDATE store_settings 
        SET is_edit = COALESCE(is_edit, false),
            is_cancelled = COALESCE(is_cancelled, false)
        WHERE is_edit IS NULL OR is_cancelled IS NULL
      `);

      console.log(
        "✅ isEdit and isCancelled columns added to store_settings successfully",
      );
    } catch (error) {
      console.log(
        "ℹ️ isEdit and isCancelled columns already exist or migration completed:",
        error.message,
      );
    }

    // Add storeCode column to all tables for multi-tenant support
    try {
      console.log("🔄 Adding storeCode column to all tables...");

      const tablesToUpdate = [
        "categories",
        "products",
        "transactions",
        "transaction_items",
        "employees",
        "attendance_records",
        "tables",
        "orders",
        "order_items",
        "suppliers",
        "customers",
        "point_transactions",
        "inventory_transactions",
        "invoices",
        "invoice_items",
        "einvoice_connections",
        "printer_configs",
        "invoice_templates",
        "purchase_receipts",
        "purchase_receipt_items",
        "purchase_receipt_documents",
        "income_vouchers",
        "expense_vouchers",
        "payment_methods",
      ];

      for (const table of tablesToUpdate) {
        try {
          await db.execute(
            sql.raw(`
            ALTER TABLE ${table} 
            ADD COLUMN IF NOT EXISTS store_code VARCHAR(50)
          `),
          );

          // Create index for better query performance
          await db.execute(
            sql.raw(`
            CREATE INDEX IF NOT EXISTS idx_${table}_store_code 
            ON ${table}(store_code)
          `),
          );

          console.log(`  ✅ Added storeCode to ${table}`);
        } catch (tableError) {
          console.log(
            `  ℹ️ storeCode already exists in ${table} or error:`,
            tableError.message,
          );
        }
      }

      console.log("✅ storeCode column migration completed successfully");
    } catch (error) {
      console.log("⚠️ storeCode migration error:", error);
    }

    // Add isPaid column to orders table
    try {
      // Check if column already exists
      const columnCheck = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'is_paid'
      `);

      const columnExists = columnCheck.rows && columnCheck.rows.length > 0;

      if (!columnExists) {
        // Only add column and update data if it doesn't exist
        await db.execute(sql`
          ALTER TABLE orders ADD COLUMN is_paid BOOLEAN NOT NULL DEFAULT false
        `);

        // Create index for better query performance
        await db.execute(sql`
          CREATE INDEX IF NOT EXISTS idx_orders_is_paid ON orders(is_paid)
        `);

        // Only update existing records when column is first created
        await db.execute(sql`
          UPDATE orders SET is_paid = true WHERE payment_status = 'paid'
        `);

        console.log("✅ isPaid column added to orders table successfully");
      } else {
        console.log("ℹ️ isPaid column already exists, skipping migration");
      }
    } catch (error) {
      console.log(
        "ℹ️ isPaid migration error or already completed:",
        error.message,
      );
    }

    // Run migration for email constraint in employees table
    try {
      await db.execute(sql`
        ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_email_unique
      `);

      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS employees_email_unique_idx 
        ON employees (email) 
        WHERE email IS NOT NULL AND email != ''
      `);

      await db.execute(sql`
        UPDATE employees SET email = NULL WHERE email = ''
      `);

      console.log(
        "Migration for employees email constraint completed successfully.",
      );
    } catch (migrationError) {
      console.log(
        "Email constraint migration already applied or error:",
        migrationError,
      );
    }

    // Skip sample data initialization - using external database
    console.log("🔍 Checking customer table data...");
    const customerCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers);
    console.log(
      `📊 Found ${customerCount[0]?.count || 0} customers in database`,
    );

    // Note: Sample data insertion disabled for external database
    console.log("ℹ️ Sample data insertion skipped - using external database");

    // Add notes column to transactions table if it doesn't exist
    try {
      await db.execute(sql`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT
      `);
      console.log(
        "Migration for notes column in transactions table completed successfully.",
      );
    } catch (migrationError) {
      console.log(
        "Notes column migration already applied or error:",
        migrationError,
      );
    }

    // Add invoice_id and invoice_number columns to transactions table if they don't exist
    try {
      await db.execute(sql`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id)
      `);
      await db.execute(sql`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50)
      `);
      console.log(
        "Migration for invoice_id and invoice_number columns in transactions table completed successfully.",
      );
    } catch (migrationError) {
      console.log(
        "Invoice columns migration already applied or error:",
        migrationError,
      );
    }

    // Initialize inventory_transactions table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS inventory_transactions (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(id) NOT NULL,
          type VARCHAR(20) NOT NULL,
          quantity INTEGER NOT NULL,
          previous_stock INTEGER NOT NULL,
          new_stock INTEGER NOT NULL,
          notes TEXT,
          created_at VARCHAR(50) NOT NULL
        )
      `);
      console.log("Inventory transactions table initialized");
    } catch (error) {
      console.log(
        "Inventory transactions table already exists or initialization failed:",
        error,
      );
    }

    // Initialize einvoice_connections table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS einvoice_connections (
          id SERIAL PRIMARY KEY,
          symbol VARCHAR(10) NOT NULL,
          tax_code VARCHAR(20) NOT NULL,
          login_id VARCHAR(50) NOT NULL,
          password TEXT NOT NULL,
          software_name VARCHAR(50) NOT NULL,
          login_url TEXT,
          sign_method VARCHAR(20) NOT NULL DEFAULT 'Ký server',
          cqt_code VARCHAR(20) NOT NULL DEFAULT 'Cấp nhật',
          notes TEXT,
          is_default BOOLEAN NOT NULL DEFAULT false,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create indexes for better performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_einvoice_connections_symbol ON einvoice_connections(symbol)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_einvoice_connections_active ON einvoice_connections(is_active)
      `);

      console.log("E-invoice connections table initialized");
    } catch (error) {
      console.log(
        "E-invoice connections table already exists or initialization failed:",
        error,
      );
    }

    // Initialize invoice_templates table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS invoice_templates (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          template_number VARCHAR(50) NOT NULL,
          template_code VARCHAR(50),
          symbol VARCHAR(20) NOT NULL,
          use_ck BOOLEAN NOT NULL DEFAULT true,
          notes TEXT,
          is_default BOOLEAN NOT NULL DEFAULT false,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create indexes for better performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_invoice_templates_symbol ON invoice_templates(symbol)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_invoice_templates_default ON invoice_templates(is_default)
      `);

      console.log("Invoice templates table initialized");
    } catch (error) {
      console.log(
        "Invoice templates table already exists or initialization failed:",
        error,
      );
    }

    // Initialize invoices table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS invoices (
          id SERIAL PRIMARY KEY,
          invoice_number VARCHAR(50) UNIQUE NOT NULL,
          customer_id INTEGER,
          customer_name VARCHAR(100) NOT NULL,
          customer_tax_code VARCHAR(20),
          customer_address TEXT,
          customer_phone VARCHAR(20),
          customer_email VARCHAR(100),
          subtotal DECIMAL(10, 2) NOT NULL,
          tax DECIMAL(10, 2) NOT NULL,
          total DECIMAL(10, 2) NOT NULL,
          payment_method VARCHAR(50) NOT NULL,
          invoice_date TIMESTAMP NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          einvoice_status INTEGER NOT NULL DEFAULT 0,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create indexes for better performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)
      `);

      console.log("Invoices table initialized");
    } catch (error) {
      console.log(
        "Invoices table already exists or initialization failed:",
        error,
      );
    }

    // Initialize printer_configs table if it doesn't exist
    try {
      // Check if table exists first
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'printer_configs'
        )
      `);

      if (!tableExists.rows[0]?.exists) {
        await db.execute(sql`
          CREATE TABLE printer_configs (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            printer_type VARCHAR(50) NOT NULL DEFAULT 'thermal',
            connection_type VARCHAR(50) NOT NULL DEFAULT 'usb',
            ip_address VARCHAR(45),
            port INTEGER DEFAULT 9100,
            mac_address VARCHAR(17),
            paper_width INTEGER NOT NULL DEFAULT 80,
            print_speed INTEGER DEFAULT 100,
            is_primary BOOLEAN NOT NULL DEFAULT false,
            is_secondary BOOLEAN NOT NULL DEFAULT false,
            is_active BOOLEAN NOT NULL DEFAULT true,
            copies INTEGER NOT NULL DEFAULT 0,
            floor VARCHAR(50) DEFAULT '1',
            zone VARCHAR(50) DEFAULT 'A',
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          )
        `);

        // Create indexes for better performance
        await db.execute(sql`
          CREATE INDEX idx_printer_configs_primary ON printer_configs(is_primary)
        `);
        await db.execute(sql`
          CREATE INDEX idx_printer_configs_active ON printer_configs(is_active)
        `);
        await db.execute(sql`
          CREATE INDEX idx_printer_configs_floor ON printer_configs(floor)
        `);

        console.log("Printer configs table created successfully");
      } else {
        // Add missing columns if table exists
        try {
          await db.execute(sql`
            ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false
          `);
          await db.execute(sql`
            ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS is_secondary BOOLEAN DEFAULT false
          `);
          await db.execute(sql`
            ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS copies INTEGER DEFAULT 0
          `);
          await db.execute(sql`
            ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS floor VARCHAR(50) DEFAULT '1'
          `);
          await db.execute(sql`
            ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS zone VARCHAR(50) DEFAULT 'A'
          `);

          // Update existing records to have default values
          await db.execute(sql`
            UPDATE printer_configs SET copies = 0 WHERE copies IS NULL
          `);
          await db.execute(sql`
            UPDATE printer_configs SET floor = '1' WHERE floor IS NULL
          `);
          await db.execute(sql`
            UPDATE printer_configs SET zone = 'A' WHERE zone IS NULL
          `);

          // Create index for floor if not exists
          await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_printer_configs_floor ON printer_configs(floor)
          `);

          console.log("Printer configs table columns updated");
        } catch (columnError) {
          console.log(
            "Printer configs columns already exist:",
            columnError.message,
          );
        }
      }
    } catch (error) {
      console.log("Printer configs table initialization error:", error.message);
    }

    // Initialize invoice_items table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS invoice_items (
          id SERIAL PRIMARY KEY,
          invoice_id INTEGER REFERENCES invoices(id) NOT NULL,
          product_id INTEGER,
          product_name VARCHAR(200) NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10, 2) NOT NULL,
          total DECIMAL(10, 2) NOT NULL,
          tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 10.00
        )
      `);

      // Create indexes for better performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id)
      `);

      console.log("Invoice items table initialized");
    } catch (error) {
      console.log(
        "Invoice items table already exists or initialization failed:",
        error,
      );
    }

    // Initialize purchase_receipts table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS purchase_receipts (
          id SERIAL PRIMARY KEY,
          receipt_number TEXT NOT NULL UNIQUE,
          supplier_id INTEGER REFERENCES suppliers(id) NOT NULL,
          employee_id INTEGER REFERENCES employees(id),
          purchase_date DATE,
          actual_delivery_date DATE,
          subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create indexes for better performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_purchase_receipts_receipt_number ON purchase_receipts(receipt_number)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_purchase_receipts_supplier_id ON purchase_receipts(supplier_id)
      `);

      console.log("Purchase receipts table initialized successfully");
    } catch (error) {
      console.log(
        "Purchase receipts table already exists or initialization failed:",
        error,
      );
    }

    // Initialize purchase_receipt_items table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS purchase_receipt_items (
          id SERIAL PRIMARY KEY,
          purchase_receipt_id INTEGER REFERENCES purchase_receipts(id) ON DELETE CASCADE NOT NULL,
          product_id INTEGER REFERENCES products(id),
          product_name TEXT NOT NULL,
          sku TEXT,
          quantity INTEGER NOT NULL,
          received_quantity INTEGER NOT NULL DEFAULT 0,
          unit_price DECIMAL(10, 2) NOT NULL,
          total DECIMAL(10, 2) NOT NULL,
          tax_rate DECIMAL(5, 2) DEFAULT 0.00,
          notes TEXT
        )
      `);

      // Create indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_receipt_id ON purchase_receipt_items(purchase_receipt_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_product_id ON purchase_receipt_items(product_id)
      `);

      console.log("Purchase receipt items table initialized successfully");
    } catch (error) {
      console.log(
        "Purchase receipt items table already exists or initialization failed:",
        error,
      );
    }

    // Add row_order column to purchase_receipt_items table
    try {
      await db.execute(sql`
        ALTER TABLE purchase_receipt_items 
        ADD COLUMN IF NOT EXISTS row_order INTEGER DEFAULT 0
      `);

      // Update existing rows with sequential order based on id
      await db.execute(sql`
        UPDATE purchase_receipt_items 
        SET row_order = subquery.row_num
        FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY purchase_receipt_id ORDER BY id) as row_num
          FROM purchase_receipt_items
        ) AS subquery
        WHERE purchase_receipt_items.id = subquery.id
        AND purchase_receipt_items.row_order = 0
      `);

      // Create index for better performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_row_order 
        ON purchase_receipt_items(purchase_receipt_id, row_order)
      `);

      console.log(
        "Migration for row_order column in purchase_receipt_items completed successfully.",
      );
    } catch (error) {
      console.log(
        "Row_order column migration already applied or error:",
        error,
      );
    }

    // Initialize purchase_receipt_documents table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS purchase_receipt_documents (
          id SERIAL PRIMARY KEY,
          purchase_receipt_id INTEGER REFERENCES purchase_receipts(id) ON DELETE CASCADE NOT NULL,
          file_name TEXT NOT NULL,
          original_file_name TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          file_path TEXT NOT NULL,
          description TEXT,
          uploaded_by INTEGER REFERENCES employees(id),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_purchase_receipt_documents_receipt_id ON purchase_receipt_documents(purchase_receipt_id)
      `);

      console.log("Purchase receipt documents table initialized successfully");
    } catch (error) {
      console.log(
        "Purchase receipt documents table already exists or initialization failed:",
        error,
      );
    }

    // Add missing created_at and updated_at columns to store_settings
    try {
      await db.execute(sql`
        ALTER TABLE store_settings 
        ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
      `);

      await db.execute(sql`
        ALTER TABLE store_settings 
        ADD COLUMN IF NOT EXISTS updated_at TEXT DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
      `);

      // Update existing records with timestamps
      await db.execute(sql`
        UPDATE store_settings 
        SET 
          created_at = COALESCE(created_at, to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
          updated_at = COALESCE(updated_at, to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
      `);

      console.log(
        "✅ Missing timestamp columns added to store_settings successfully",
      );
    } catch (error) {
      console.log(
        "ℹ️ Store settings timestamp columns already exist or migration completed:",
        error.message,
      );
    }

    // Add default_zone column to store_settings
    try {
      await db.execute(sql`
        ALTER TABLE store_settings 
        ADD COLUMN IF NOT EXISTS default_zone TEXT DEFAULT 'A'
      `);

      // Update existing records to have default zone value
      await db.execute(sql`
        UPDATE store_settings 
        SET default_zone = COALESCE(default_zone, 'A')
        WHERE default_zone IS NULL
      `);

      console.log(
        "✅ default_zone column added to store_settings successfully",
      );
    } catch (error) {
      console.log(
        "ℹ️ default_zone column already exists or migration completed:",
        error.message,
      );
    }

    // Add userName, password, isAdmin, and parent columns to store_settings
    try {
      await db.execute(sql`
        ALTER TABLE store_settings 
        ADD COLUMN IF NOT EXISTS user_name TEXT
      `);
      await db.execute(sql`
        ALTER TABLE store_settings 
        ADD COLUMN IF NOT EXISTS password TEXT
      `);
      await db.execute(sql`
        ALTER TABLE store_settings 
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false
      `);
      await db.execute(sql`
        ALTER TABLE store_settings 
        ADD COLUMN IF NOT EXISTS parent TEXT
      `);

      // Remove unique constraint on pin_code to allow duplicates
      await db.execute(sql`
        DROP INDEX IF EXISTS store_settings_pin_code_unique
      `);

      await db.execute(sql`
        DROP INDEX IF EXISTS store_settings_pin_code_unique_idx
      `);

      // Add typeUser column
      await db.execute(sql`
        ALTER TABLE store_settings 
        ADD COLUMN IF NOT EXISTS type_user INTEGER DEFAULT 0
      `);

      // Update existing records to have default values
      await db.execute(sql`
        UPDATE store_settings 
        SET is_admin = COALESCE(is_admin, false),
            type_user = COALESCE(type_user, 0)
        WHERE is_admin IS NULL OR type_user IS NULL
      `);

      console.log(
        "✅ userName, password, isAdmin, parent, and typeUser columns added to store_settings successfully",
      );
      console.log("✅ Unique constraint added to pin_code column");
    } catch (error) {
      console.log(
        "ℹ️ User management columns already exist or migration completed:",
        error.message,
      );
    }

    // Ensure floor column exists in tables
    try {
      await db.execute(sql`
        ALTER TABLE tables ADD COLUMN IF NOT EXISTS floor VARCHAR(50) DEFAULT '1층'
      `);

      // Update existing tables
      await db.execute(sql`
        UPDATE tables SET floor = '1층' WHERE floor IS NULL
      `);
      console.log("✅ Floor column added to tables successfully");
    } catch (error) {
      console.log(
        "ℹ️ Floor column already exists or migration completed:",
        error.message,
      );
    }

    // Ensure zone column exists in tables
    try {
      await db.execute(sql`
        ALTER TABLE tables ADD COLUMN IF NOT EXISTS zone VARCHAR(50) DEFAULT 'A구역'
      `);

      // Update existing tables
      await db.execute(sql`
        UPDATE tables SET zone = 'A구역' WHERE zone IS NULL
      `);
      console.log("✅ Zone column added to tables successfully");
    } catch (error) {
      console.log(
        "ℹ️ Zone column already exists or migration completed:",
        error.message,
      );
    }

    // Ensure floor and zone management columns exist in store_settings
    try {
      await db.execute(sql`
        ALTER TABLE store_settings 
        ADD COLUMN IF NOT EXISTS default_floor TEXT DEFAULT '1',
        ADD COLUMN IF NOT EXISTS floor_prefix TEXT DEFAULT '층',
        ADD COLUMN IF NOT EXISTS zone_prefix TEXT DEFAULT '구역'
      `);

      // Remove enable_multi_floor column if it exists
      await db.execute(sql`
        ALTER TABLE store_settings 
        DROP COLUMN IF EXISTS enable_multi_floor
      `);

      // Update existing records
      await db.execute(sql`
        UPDATE store_settings 
        SET 
          default_floor = COALESCE(default_floor, '1'),
          floor_prefix = COALESCE(floor_prefix, '층'),
          zone_prefix = COALESCE(zone_prefix, '구역')
      `);
      console.log("✅ Floor and zone settings columns added successfully");
    } catch (error) {
      console.log(
        "ℹ️ Floor and zone settings columns already exist or migration completed:",
        error.message,
      );
    }

    // Initialize expense_vouchers table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS expense_vouchers (
          id SERIAL PRIMARY KEY,
          voucher_number VARCHAR(50) NOT NULL,
          date VARCHAR(10) NOT NULL,
          amount NUMERIC(12, 2) NOT NULL,
          account VARCHAR(50) NOT NULL,
          recipient VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          category VARCHAR(50) NOT NULL,
          description TEXT,
          supplier_id INTEGER REFERENCES suppliers(id),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes for expense_vouchers
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_expense_vouchers_date ON expense_vouchers(date)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_expense_vouchers_voucher_number ON expense_vouchers(voucher_number)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_expense_vouchers_category ON expense_vouchers(category)
      `);

      console.log("Expense vouchers table initialized successfully");
    } catch (error) {
      console.log(
        "Expense vouchers table already exists or initialization failed:",
        error,
      );
    }

    // Migration: Convert all TIMESTAMP columns to TIMESTAMPTZ
    try {
      console.log(
        "🔄 Starting migration: Converting TIMESTAMP to TIMESTAMPTZ...",
      );

      // List of tables and their timestamp columns to migrate
      const timestampMigrations = [
        { table: "employees", columns: ["hire_date", "created_at"] },
        {
          table: "attendance_records",
          columns: [
            "clock_in",
            "clock_out",
            "break_start",
            "break_end",
            "created_at",
          ],
        },
        {
          table: "orders",
          columns: [
            "ordered_at",
            "served_at",
            "paid_at",
            "created_at",
            "updated_at",
          ],
        },
        {
          table: "invoices",
          columns: ["invoice_date", "created_at", "updated_at"],
        },
        {
          table: "einvoice_connections",
          columns: ["created_at", "updated_at"],
        },
        { table: "invoice_templates", columns: ["created_at", "updated_at"] },
        { table: "purchase_receipts", columns: ["created_at", "updated_at"] },
        { table: "purchase_receipt_documents", columns: ["created_at"] },
        { table: "printer_configs", columns: ["created_at", "updated_at"] },
        { table: "tables", columns: ["created_at", "updated_at"] },
        { table: "suppliers", columns: ["created_at", "updated_at"] },
        { table: "customers", columns: ["created_at", "updated_at"] },
        { table: "store_settings", columns: ["created_at", "updated_at"] },
        { table: "expense_vouchers", columns: ["created_at", "updated_at"] },
      ];

      for (const migration of timestampMigrations) {
        for (const column of migration.columns) {
          try {
            // Check if column exists and is TIMESTAMP type
            const columnInfo = await db.execute(sql`
              SELECT data_type 
              FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = ${migration.table} 
              AND column_name = ${column}
            `);

            if (columnInfo.rows.length > 0) {
              const dataType = columnInfo.rows[0].data_type;

              if (dataType === "timestamp without time zone") {
                // Convert TIMESTAMP to TIMESTAMPTZ
                await db.execute(
                  sql.raw(`
                  ALTER TABLE ${migration.table} 
                  ALTER COLUMN ${column} TYPE TIMESTAMPTZ 
                  USING ${column} AT TIME ZONE 'UTC'
                `),
                );

                console.log(
                  `  ✅ Converted ${migration.table}.${column} to TIMESTAMPTZ`,
                );
              } else if (dataType === "timestamp with time zone") {
                console.log(
                  `  ℹ️ ${migration.table}.${column} already TIMESTAMPTZ`,
                );
              }
            }
          } catch (colError) {
            console.log(
              `  ⚠️ Could not convert ${migration.table}.${column}:`,
              colError.message,
            );
          }
        }
      }

      console.log(
        "✅ TIMESTAMP to TIMESTAMPTZ migration completed successfully",
      );
    } catch (migrationError) {
      console.log(
        "⚠️ TIMESTAMP to TIMESTAMPTZ migration error:",
        migrationError,
      );
    }

    // Add receiver_name column to income_vouchers table
    try {
      await db.execute(sql`
        ALTER TABLE income_vouchers 
        ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(255)
      `);

      console.log(
        "Migration for receiver_name column in income_vouchers completed successfully.",
      );
    } catch (error) {
      console.log(
        "Income vouchers receiver_name column migration failed or already applied:",
        error,
      );
    }

    // Initialize payment_methods table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS payment_methods (
          id SERIAL PRIMARY KEY,
          name_key VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          type VARCHAR(50) NOT NULL,
          icon TEXT NOT NULL,
          enabled BOOLEAN NOT NULL DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          is_system BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        )
      `);

      // Create indexes for better performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_payment_methods_enabled ON payment_methods(enabled)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_payment_methods_sort_order ON payment_methods(sort_order)
      `);

      // Insert default payment methods if table is empty
      const checkData = await db.execute(sql`
        SELECT COUNT(*) as count FROM payment_methods
      `);

      if (checkData.rows[0]?.count === 0 || checkData.rows[0]?.count === "0") {
        await db.execute(sql`
          INSERT INTO payment_methods (name_key, name, type, icon, enabled, sort_order, is_system) VALUES
          ('cash', 'Tiền mặt', 'cash', '💵', true, 1, true),
          ('creditCard', 'Thẻ tín dụng', 'card', '💳', true, 2, true),
          ('debitCard', 'Thẻ ghi nợ', 'debit', '💳', false, 3, true),
          ('momo', 'MoMo', 'digital', '📱', false, 4, true),
          ('zalopay', 'ZaloPay', 'digital', '📱', true, 5, true),
          ('vnpay', 'VNPay', 'digital', '💳', false, 6, true),
          ('qrCode', 'Mã QR', 'qr', '📱', true, 7, true),
          ('shopeepay', 'ShopeePay', 'digital', '🛒', false, 8, true),
          ('grabpay', 'GrabPay', 'digital', '🚗', false, 9, true)
        `);
        console.log("✅ Default payment methods inserted successfully");
      }

      console.log("Payment methods table initialized successfully");
    } catch (error) {
      console.log(
        "Payment methods table already exists or initialization failed:",
        error,
      );
    }

    // Initialize price_lists table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS price_lists (
          id SERIAL PRIMARY KEY,
          code VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          is_default BOOLEAN NOT NULL DEFAULT false,
          valid_from TIMESTAMP WITH TIME ZONE,
          valid_to TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);

      // Create indexes for better performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_price_lists_code ON price_lists(code)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_price_lists_is_active ON price_lists(is_active)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_price_lists_is_default ON price_lists(is_default)
      `);

      console.log("✅ Price lists table initialized successfully");
    } catch (error) {
      console.log(
        "Price lists table already exists or initialization failed:",
        error,
      );
    }

    // Initialize price_list_items table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS price_list_items (
          id SERIAL PRIMARY KEY,
          price_list_id INTEGER NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          price DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          UNIQUE(price_list_id, product_id)
        )
      `);

      // Create indexes for better performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_price_list_items_price_list_id ON price_list_items(price_list_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_price_list_items_product_id ON price_list_items(product_id)
      `);

      console.log("✅ Price list items table initialized successfully");
    } catch (error) {
      console.log(
        "Price list items table already exists or initialization failed:",
        error,
      );
    }

    // Comprehensive database schema validation and migration
    console.log("🔍 Starting comprehensive schema validation...");

    // Categories table
    try {
      await db.execute(sql`
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT 'fa-folder'
      `);
      console.log("✅ Categories table schema validated");
    } catch (error) {
      console.log("⚠️ Categories migration error:", error.message);
    }

    // Products table - comprehensive check
    try {
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT
      `);
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0
      `);
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id)
      `);
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT
      `);
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
      `);
      await db.execute(sql`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN NOT NULL DEFAULT true
      `);
      console.log("✅ Products table schema validated");
    } catch (error) {
      console.log("⚠️ Products migration error:", error.message);
    }

    // Transactions table
    try {
      await db.execute(sql`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_id TEXT
      `);
      await db.execute(sql`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);
      await db.execute(sql`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);
      await db.execute(sql`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);
      await db.execute(sql`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash'
      `);
      await db.execute(sql`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount_received DECIMAL(10,2)
      `);
      await db.execute(sql`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS change DECIMAL(10,2)
      `);
      await db.execute(sql`
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cashier_name TEXT NOT NULL DEFAULT ''
      `);
      console.log("✅ Transactions table schema validated");
    } catch (error) {
      console.log("⚠️ Transactions migration error:", error.message);
    }

    // Transaction items table
    try {
      await db.execute(sql`
        ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS transaction_id INTEGER REFERENCES transactions(id)
      `);
      await db.execute(sql`
        ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id)
      `);
      await db.execute(sql`
        ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS product_name TEXT NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);
      await db.execute(sql`
        ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 0
      `);
      await db.execute(sql`
        ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);
      console.log("✅ Transaction items table schema validated");
    } catch (error) {
      console.log("⚠️ Transaction items migration error:", error.message);
    }

    // Employees table
    try {
      await db.execute(sql`
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_id TEXT
      `);
      await db.execute(sql`
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS email TEXT
      `);
      await db.execute(sql`
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone TEXT
      `);
      await db.execute(sql`
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'cashier'
      `);
      await db.execute(sql`
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
      `);
      console.log("✅ Employees table schema validated");
    } catch (error) {
      console.log("⚠️ Employees migration error:", error.message);
    }

    // Attendance records table
    try {
      await db.execute(sql`
        ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id)
      `);
      await db.execute(sql`
        ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS total_hours DECIMAL(4,2)
      `);
      await db.execute(sql`
        ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS overtime DECIMAL(4,2) DEFAULT 0.00
      `);
      await db.execute(sql`
        ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'present'
      `);
      await db.execute(sql`
        ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS notes TEXT
      `);
      console.log("✅ Attendance records table schema validated");
    } catch (error) {
      console.log("⚠️ Attendance records migration error:", error.message);
    }

    // Store settings table
    try {
      await db.execute(sql`
        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_name TEXT NOT NULL DEFAULT 'EDPOS 레스토랑'
      `);
      await db.execute(sql`
        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_code TEXT
      `);
      await db.execute(sql`
        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS tax_id TEXT
      `);
      await db.execute(sql`
        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'restaurant'
      `);
      await db.execute(sql`
        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS address TEXT
      `);
      await db.execute(sql`
        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS phone TEXT
      `);
      await db.execute(sql`
        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS email TEXT
      `);
      await db.execute(sql`
        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS open_time TEXT DEFAULT '09:00'
      `);
      await db.execute(sql`
        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS close_time TEXT DEFAULT '22:00'
      `);
      console.log("✅ Store settings table schema validated");
    } catch (error) {
      console.log("⚠️ Store settings migration error:", error.message);
    }

    // Suppliers table
    try {
      await db.execute(sql`
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS code TEXT
      `);
      await db.execute(sql`
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person TEXT
      `);
      await db.execute(sql`
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone TEXT
      `);
      await db.execute(sql`
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email TEXT
      `);
      await db.execute(sql`
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address TEXT
      `);
      await db.execute(sql`
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tax_id TEXT
      `);
      await db.execute(sql`
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_account TEXT
      `);
      await db.execute(sql`
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '30일'
      `);
      await db.execute(sql`
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
      `);
      await db.execute(sql`
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT
      `);
      console.log("✅ Suppliers table schema validated");
    } catch (error) {
      console.log("⚠️ Suppliers migration error:", error.message);
    }

    // Customers table
    try {
      await db.execute(sql`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_id TEXT
      `);
      await db.execute(sql`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT
      `);
      await db.execute(sql`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT
      `);
      await db.execute(sql`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT
      `);
      await db.execute(sql`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_code TEXT
      `);
      await db.execute(sql`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0
      `);
      await db.execute(sql`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'bronze'
      `);
      await db.execute(sql`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spent DECIMAL(12,2) DEFAULT 0
      `);
      await db.execute(sql`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_visit TEXT
      `);
      await db.execute(sql`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT
      `);
      await db.execute(sql`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
      `);
      console.log("✅ Customers table schema validated");
    } catch (error) {
      console.log("⚠️ Customers migration error:", error.message);
    }

    // Point transactions table
    try {
      await db.execute(sql`
        ALTER TABLE point_transactions ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id)
      `);
      await db.execute(sql`
        ALTER TABLE point_transactions ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'earned'
      `);
      await db.execute(sql`
        ALTER TABLE point_transactions ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0
      `);
      await db.execute(sql`
        ALTER TABLE point_transactions ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE point_transactions ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES orders(id)
      `);
      await db.execute(sql`
        ALTER TABLE point_transactions ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id)
      `);
      await db.execute(sql`
        ALTER TABLE point_transactions ADD COLUMN IF NOT EXISTS previous_balance INTEGER NOT NULL DEFAULT 0
      `);
      await db.execute(sql`
        ALTER TABLE point_transactions ADD COLUMN IF NOT EXISTS new_balance INTEGER NOT NULL DEFAULT 0
      `);
      console.log("✅ Point transactions table schema validated");
    } catch (error) {
      console.log("⚠️ Point transactions migration error:", error.message);
    }

    // Inventory transactions table
    try {
      await db.execute(sql`
        ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id)
      `);
      await db.execute(sql`
        ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'add'
      `);
      await db.execute(sql`
        ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 0
      `);
      await db.execute(sql`
        ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS previous_stock INTEGER NOT NULL DEFAULT 0
      `);
      await db.execute(sql`
        ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS new_stock INTEGER NOT NULL DEFAULT 0
      `);
      await db.execute(sql`
        ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS notes TEXT
      `);
      await db.execute(sql`
        ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS invoice_id INTEGER
      `);
      await db.execute(sql`
        ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50)
      `);
      await db.execute(sql`
        ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS created_at VARCHAR(50) NOT NULL DEFAULT ''
      `);
      console.log("✅ Inventory transactions table schema validated");
    } catch (error) {
      console.log("⚠️ Inventory transactions migration error:", error.message);
    }

    // E-invoice connections table
    try {
      await db.execute(sql`
        ALTER TABLE einvoice_connections ADD COLUMN IF NOT EXISTS symbol VARCHAR(10) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE einvoice_connections ADD COLUMN IF NOT EXISTS tax_code VARCHAR(20) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE einvoice_connections ADD COLUMN IF NOT EXISTS login_id VARCHAR(50) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE einvoice_connections ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE einvoice_connections ADD COLUMN IF NOT EXISTS software_name VARCHAR(50) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE einvoice_connections ADD COLUMN IF NOT EXISTS login_url TEXT
      `);
      await db.execute(sql`
        ALTER TABLE einvoice_connections ADD COLUMN IF NOT EXISTS sign_method VARCHAR(20) NOT NULL DEFAULT 'Ký server'
      `);
      await db.execute(sql`
        ALTER TABLE einvoice_connections ADD COLUMN IF NOT EXISTS cqt_code VARCHAR(20) NOT NULL DEFAULT 'Cấp nhật'
      `);
      await db.execute(sql`
        ALTER TABLE einvoice_connections ADD COLUMN IF NOT EXISTS notes TEXT
      `);
      await db.execute(sql`
        ALTER TABLE einvoice_connections ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false
      `);
      await db.execute(sql`
        ALTER TABLE einvoice_connections ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
      `);
      console.log("✅ E-invoice connections table schema validated");
    } catch (error) {
      console.log("⚠️ E-invoice connections migration error:", error.message);
    }

    // Printer configs table
    try {
      await db.execute(sql`
        ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS printer_type VARCHAR(50) NOT NULL DEFAULT 'thermal'
      `);
      await db.execute(sql`
        ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS connection_type VARCHAR(50) NOT NULL DEFAULT 'usb'
      `);
      await db.execute(sql`
        ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)
      `);
      await db.execute(sql`
        ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS port INTEGER DEFAULT 9100
      `);
      await db.execute(sql`
        ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS mac_address VARCHAR(17)
      `);
      await db.execute(sql`
        ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS paper_width INTEGER NOT NULL DEFAULT 80
      `);
      await db.execute(sql`
        ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS print_speed INTEGER DEFAULT 100
      `);
      console.log("✅ Printer configs table schema validated");
    } catch (error) {
      console.log("⚠️ Printer configs migration error:", error.message);
    }

    // Invoice templates table
    try {
      await db.execute(sql`
        ALTER TABLE invoice_templates ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE invoice_templates ADD COLUMN IF NOT EXISTS template_number VARCHAR(50) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE invoice_templates ADD COLUMN IF NOT EXISTS symbol VARCHAR(20) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE invoice_templates ADD COLUMN IF NOT EXISTS use_ck BOOLEAN NOT NULL DEFAULT true
      `);
      await db.execute(sql`
        ALTER TABLE invoice_templates ADD COLUMN IF NOT EXISTS notes TEXT
      `);
      await db.execute(sql`
        ALTER TABLE invoice_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false
      `);
      await db.execute(sql`
        ALTER TABLE invoice_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
      `);
      console.log("✅ Invoice templates table schema validated");
    } catch (error) {
      console.log("⚠️ Invoice templates migration error:", error.message);
    }

    // Invoices table
    try {
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id)
      `);
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_tax_code VARCHAR(20)
      `);
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_address TEXT
      `);
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20)
      `);
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_email VARCHAR(100)
      `);
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method INTEGER NOT NULL DEFAULT 1
      `);
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft'
      `);
      await db.execute(sql`
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT
      `);
      console.log("✅ Invoices table schema validated");
    } catch (error) {
      console.log("⚠️ Invoices migration error:", error.message);
    }

    // Invoice items table
    try {
      await db.execute(sql`
        ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id)
      `);
      await db.execute(sql`
        ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id)
      `);
      await db.execute(sql`
        ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(200) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 0
      `);
      await db.execute(sql`
        ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);
      await db.execute(sql`
        ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) NOT NULL DEFAULT 0.00
      `);
      console.log("✅ Invoice items table schema validated");
    } catch (error) {
      console.log("⚠️ Invoice items migration error:", error.message);
    }

    // Income vouchers table
    try {
      await db.execute(sql`
        ALTER TABLE income_vouchers ADD COLUMN IF NOT EXISTS voucher_number VARCHAR(50) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE income_vouchers ADD COLUMN IF NOT EXISTS date VARCHAR(10) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE income_vouchers ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2) NOT NULL DEFAULT 0
      `);
      await db.execute(sql`
        ALTER TABLE income_vouchers ADD COLUMN IF NOT EXISTS account VARCHAR(50) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE income_vouchers ADD COLUMN IF NOT EXISTS recipient VARCHAR(255) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE income_vouchers ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
      `);
      await db.execute(sql`
        ALTER TABLE income_vouchers ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE income_vouchers ADD COLUMN IF NOT EXISTS description TEXT
      `);
      console.log("✅ Income vouchers table schema validated");
    } catch (error) {
      console.log("⚠️ Income vouchers migration error:", error.message);
    }

    // Expense vouchers table
    try {
      await db.execute(sql`
        ALTER TABLE expense_vouchers ADD COLUMN IF NOT EXISTS voucher_number VARCHAR(50) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE expense_vouchers ADD COLUMN IF NOT EXISTS date VARCHAR(10) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE expense_vouchers ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2) NOT NULL DEFAULT 0
      `);
      await db.execute(sql`
        ALTER TABLE expense_vouchers ADD COLUMN IF NOT EXISTS account VARCHAR(50) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE expense_vouchers ADD COLUMN IF NOT EXISTS recipient VARCHAR(255) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE expense_vouchers ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
      `);
      await db.execute(sql`
        ALTER TABLE expense_vouchers ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT ''
      `);
      await db.execute(sql`
        ALTER TABLE expense_vouchers ADD COLUMN IF NOT EXISTS description TEXT
      `);
      await db.execute(sql`
        ALTER TABLE expense_vouchers ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id)
      `);
      console.log("✅ Expense vouchers table schema validated");
    } catch (error) {
      console.log("⚠️ Expense vouchers migration error:", error.message);
    }

    console.log("✅ Comprehensive schema validation completed successfully");

    // Add payment information columns to purchase_receipts
    try {
      await db.execute(sql`
        ALTER TABLE purchase_receipts 
        ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false
      `);
      await db.execute(sql`
        ALTER TABLE purchase_receipts 
        ADD COLUMN IF NOT EXISTS payment_method TEXT
      `);
      await db.execute(sql`
        ALTER TABLE purchase_receipts 
        ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(18,2)
      `);

      // Create index for is_paid
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_purchase_receipts_is_paid 
        ON purchase_receipts(is_paid)
      `);

      console.log(
        "Migration for payment info columns in purchase_receipts completed successfully.",
      );
    } catch (error) {
      console.log(
        "Payment info columns migration already applied or error:",
        error,
      );
    }

    // Add domain column to store_settings table
    try {
      await db.execute(sql`

      ALTER TABLE store_settings 
        ADD COLUMN IF NOT EXISTS domain TEXT
      `);

      console.log(
        "Migration for domain column in store_settings completed successfully.",
      );
    } catch (error) {
      console.log("Domain column migration already applied or error:", error);
    }

    // Add price_list_id column to store_settings
    try {
      await db.execute(sql`

      ALTER TABLE store_settings 
        ADD COLUMN IF NOT EXISTS price_list_id INTEGER REFERENCES price_lists(id)
      `);

      // Create index for price_list_id
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_store_settings_price_list_id 
        ON store_settings(price_list_id)
      `);

      console.log(
        "Migration for price_list_id column in store_settings completed successfully.",
      );
    } catch (error) {
      console.log("Price list ID migration already applied or error:", error);
    }

    // Add store_code to price_lists and price_list_items tables
    try {
      await db.execute(sql`
        ALTER TABLE price_lists 
        ADD COLUMN IF NOT EXISTS store_code VARCHAR(50)
      `);

      await db.execute(sql`
        ALTER TABLE price_list_items 
        ADD COLUMN IF NOT EXISTS store_code VARCHAR(50)
      `);

      // Create indexes for better performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_price_lists_store_code ON price_lists(store_code)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_price_list_items_store_code ON price_list_items(store_code)
      `);

      console.log(
        "Migration for store_code columns in price_lists tables completed successfully.",
      );
    } catch (error) {
      console.log(
        "Price lists store_code migration already applied or error:",
        error,
      );
    }

    // Create general_settings table
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS general_settings (
          id SERIAL PRIMARY KEY,
          setting_code VARCHAR(100) NOT NULL UNIQUE,
          setting_name VARCHAR(255) NOT NULL,
          setting_value TEXT,
          description TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          store_code VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);

      // Create indexes for better performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_general_settings_code ON general_settings(setting_code)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_general_settings_active ON general_settings(is_active)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_general_settings_store_code ON general_settings(store_code)
      `);

      console.log("✅ General settings table initialized successfully");
    } catch (error) {
      console.log(
        "General settings table already exists or initialization failed:",
        error,
      );
    }

    // Add price_list_id column to store_settings
    try {
      await db.execute(sql`

     ALTER TABLE store_settings 
        ADD
  COLUMN IF NOT EXISTS price_list_id
  INTEGER REFERENCES price_lists(id)
      `);

      // Create index for price_list_id
      await db.execute(sql`

  CREATE INDEX IF
  NOT EXISTS idx_store_settings_price_list_id 

    ON store_settings(price_list_id)
      `);

      console.log(
        "Migration for price_list_id column in store_settings completed successfully.",
      );
    } catch (error) {
      console.log("Price list ID migration already applied or error:", error);
    }

    // Run comprehensive column check migration
    try {
      console.log("🔍 Checking for missing columns from schema.ts...");

      // Read and execute the comprehensive migration file
      const fs = await import("fs");
      const path = await import("path");
      const migrationPath = path.join(
        process.cwd(),
        "server",
        "check_and_add_missing_columns.sql",
      );

      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
        await db.execute(sql.raw(migrationSQL));
        console.log("✅ Column check migration completed successfully");
      } else {
        console.log("⚠️ Migration file not found, skipping column check");
      }
    } catch (migrationError) {
      console.log("⚠️ Column check migration error:", migrationError);
    }

    console.log("✅ Database setup completed successfully");
  } catch (error) {
    console.log("⚠️ Sample data initialization skipped:", error);
  }
}
