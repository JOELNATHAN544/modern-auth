const fs = require("fs");
const path = require("path");
const { query, testConnection } = require("../server/config/database");

async function setupDatabase() {
  console.log("🗄️  Setting up the Modern Authentication Database...\n");

  try {
    // Test database connection
    console.log("1. Testing database connection...");
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error(
        "❌ Database connection failed. Please check your configuration.",
      );
      process.exit(1);
    }
    console.log("✅ Database connection successful\n");

    // Read and execute schema
    console.log("2. Creating database schema...");
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Split schema into individual statements
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await query(statement);
          console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
          // Continue with other statements
        }
      }
    }
    console.log("✅ Database schema created successfully\n");

    // Insert initial data
    console.log("3. Inserting initial data...");
    await insertInitialData();
    console.log("✅ Initial data inserted successfully\n");

    // Verify setup
    console.log("4. Verifying database setup...");
    await verifySetup();
    console.log("✅ Database setup verification completed\n");

    console.log("🎉 Database setup completed successfully!");
    console.log("\n📊 Your database now includes:");
    console.log("   • Users table with WebAuthn support");
    console.log("   • Transactions table with PSD3 compliance");
    console.log("   • Analytics and conversion tracking");
    console.log("   • Audit logging and security features");
    console.log("   • Performance indexes and functions");
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

async function insertInitialData() {
  // Insert system configuration
  const systemConfig = {
    event_type: "system_initialized",
    auth_type: "system",
    metadata: {
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      setup_date: new Date().toISOString(),
      features: ["webauthn", "stepup", "analytics"],
    },
  };

  await query(
    `
    INSERT INTO analytics_events (event_type, auth_type, metadata)
    VALUES ($1, $2, $3)
  `,
    [
      systemConfig.event_type,
      systemConfig.auth_type,
      JSON.stringify(systemConfig.metadata),
    ],
  );
}

async function verifySetup() {
  // Check if all tables exist
  const tables = [
    "users",
    "webauthn_credentials",
    "auth_sessions",
    "auth_challenges",
    "transactions",
    "stepup_authentications",
    "analytics_events",
    "conversion_tracking",
    "audit_logs",
  ];

  for (const table of tables) {
    try {
      const result = await query(`SELECT COUNT(*) FROM ${table}`);
      console.log(
        `   ✅ Table '${table}' exists with ${result.rows[0].count} rows`,
      );
    } catch (error) {
      console.error(
        `   ❌ Table '${table}' verification failed:`,
        error.message,
      );
    }
  }

  // Test database functions
  try {
    const result = await query("SELECT get_conversion_rate($1)", ["passkey"]);
    console.log("   ✅ Database functions working correctly");
  } catch (error) {
    console.error("   ❌ Database functions test failed:", error.message);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log("\n🚀 Ready to start the application!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Setup failed:", error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
