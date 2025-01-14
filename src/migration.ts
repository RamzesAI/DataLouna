import sql from './sql';

export async function createTablesAndSeedData() {
  try {
    await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(20) NOT NULL,
      email VARCHAR(50) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
      balance NUMERIC(10, 2) DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(20) NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS purchases_products (
      id SERIAL PRIMARY KEY,
      purchase_id INT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INT NOT NULL
    );
  `;

	const existingProducts = await sql`SELECT COUNT(*) FROM products;`;

	if (existingProducts[0].count === '0') {
    console.log('Seeding products table...');

    await sql`
      INSERT INTO products (name, price) VALUES
      ('Laptop', 500.00),
      ('Mouse', 50.00),
      ('Keyboard', 100.00),
      ('Monitor', 200.00),
      ('Headphones', 75.00);
    `;

    console.log('Products table seeded.');
  } else {
    console.log('Products table already has data. Skipping seed.');
  }
	
    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}
