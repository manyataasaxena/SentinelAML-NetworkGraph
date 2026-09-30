import bcrypt from "bcryptjs";
import {
  db,
  pool,
  usersTable,
  customersTable,
  transactionsTable,
  alertsTable,
  notificationsTable,
  banksTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const COUNTRIES = ["India"];

const CURRENCIES = ["INR", "EUR", "GBP", "SGD", "AED"];

const DEMO_BANKS = [
  { name: "Alpha Bank", bankCode: "ALPHA", country: "India", status: "active" as const },
  { name: "Beta Bank", bankCode: "BETA", country: "India", status: "active" as const },
  { name: "Gamma Bank", bankCode: "GAMMA", country: "India", status: "active" as const },
];

const INDIAN_DEMO_NAMES = [
  "Rahul Sharma",
  "Priya Verma",
  "Amit Kumar",
  "Neha Singh",
  "Arjun Gupta",
  "Riya Mishra",
  "Ankit Agarwal",
  "Pooja Yadav",
  "Rohit Saxena",
  "Sneha Sharma",
];

const DEMO_ACCOUNT_NAMES: Record<string, string> = {
  A101: "Rahul Sharma",
  A102: "Priya Verma",
  A103: "Ankit Agarwal",
  B201: "Amit Kumar",
  B202: "Riya Mishra",
  C301: "Rohit Saxena",
  C302: "Neha Singh",
};

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDob(): string {
  const year = randomInt(1955, 2000);
  const month = String(randomInt(1, 12)).padStart(2, "0");
  const day = String(randomInt(1, 28)).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function accountNumber(index: number): string {
  return `ACC-${String(index).padStart(6, "0")}`;
}

async function ensureCrossBankDemo() {
  await db.insert(banksTable).values(DEMO_BANKS).onConflictDoNothing({ target: banksTable.bankCode });
  const banks = await db.select().from(banksTable).orderBy(banksTable.bankCode);
  const bankByCode = new Map(banks.map((bank) => [bank.bankCode, bank]));
  const named = [
    ["Rahul Sharma", "A101", "ALPHA"],
    ["Priya Verma", "A102", "ALPHA"],
    ["Ankit Agarwal", "A103", "ALPHA"],
    ["Amit Kumar", "B201", "BETA"],
    ["Riya Mishra", "B202", "BETA"],
    ["Rohit Saxena", "C301", "GAMMA"],
    ["Neha Singh", "C302", "GAMMA"],
  ] as const;
  const customers = [];
  for (const [fullName, accountNo, bankCode] of named) {
    const existing = await db.select().from(customersTable).where(eq(customersTable.accountNo, accountNo)).limit(1);
    if (existing[0]) {
      await db.update(customersTable)
        .set({
          fullName,
          email: `${accountNo.toLowerCase()}@demo.sentinelaml`,
          country: "India",
        })
        .where(eq(customersTable.id, existing[0].id));
      customers.push(existing[0]);
    } else {
      const [created] = await db.insert(customersTable).values({
        fullName,
        accountNo,
        email: `${accountNo.toLowerCase()}@demo.sentinelaml`,
        country: "India",
        dob: "1992-01-15",
        bankId: bankByCode.get(bankCode)!.id,
      }).returning();
      customers.push(created);
    }
  }
  const byAccount = new Map(customers.map((customer) => [customer.accountNo, customer]));
  const existingDemo = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.currency, "INR"));
  const pairs = [
    ["A101", "B201", "500000.00"],
    ["A102", "B201", "250000.00"],
    ["A103", "B201", "300000.00"],
    ["B201", "C301", "900000.00"],
    ["B201", "C302", "100000.00"],
  ] as const;
  if (!pairs.every(([sender, receiver, amount]) =>
    existingDemo.some((transaction) =>
      transaction.senderId === byAccount.get(sender)!.id &&
      transaction.receiverId === byAccount.get(receiver)!.id &&
      transaction.amount === amount,
    ),
  )) {
    await db.insert(transactionsTable).values(
      pairs.map(([sender, receiver, amount], index) => ({
        senderId: byAccount.get(sender)!.id,
        receiverId: byAccount.get(receiver)!.id,
        amount,
        currency: "INR",
        timestamp: new Date(Date.now() - index * 60 * 60 * 1000),
        status: "flagged" as const,
      })),
    );
  }
  return banks;
}

async function main() {
  console.log("Seeding SentinelAML...");

  const existingUsers = await db.select().from(usersTable).limit(1);
  if (existingUsers.length === 0) {
    const passwordHash = await bcrypt.hash("Sentinel123!", 10);
    await db.insert(usersTable).values([
      { name: "Alex Rivera", email: "admin@sentinelaml.dev", passwordHash, role: "admin" },
      { name: "Jordan Blake", email: "compliance@sentinelaml.dev", passwordHash, role: "compliance_officer" },
      { name: "Sam Okafor", email: "analyst@sentinelaml.dev", passwordHash, role: "analyst" },
      { name: "Taylor Kim", email: "investigator@sentinelaml.dev", passwordHash, role: "investigator" },
    ]);
    console.log("Created 4 demo users (password: Sentinel123!)");
  } else {
    console.log("Users already exist, skipping user seed.");
  }

  const banks = await ensureCrossBankDemo();
  const bankIds = banks.map((bank) => bank.id);

  const existingCustomers = await db.select().from(customersTable);
  if (existingCustomers.length > 0) {
    for (const [index, customer] of existingCustomers.sort((a, b) => a.accountNo.localeCompare(b.accountNo)).entries()) {
      const fullName = DEMO_ACCOUNT_NAMES[customer.accountNo] || INDIAN_DEMO_NAMES[index % INDIAN_DEMO_NAMES.length]!;
      await db.update(customersTable)
        .set({
          fullName,
          email: `${customer.accountNo.toLowerCase()}@demo.sentinelaml`,
          country: "India",
        })
        .where(eq(customersTable.id, customer.id));
      if (!customer.bankId && bankIds.length > 0) {
        await db.update(customersTable)
          .set({ bankId: bankIds[index % bankIds.length] })
          .where(eq(customersTable.id, customer.id));
      }
    }
    console.log("Customers already exist, skipping data seed.");
    await pool.end();
    return;
  }

  const CUSTOMER_COUNT = 120;
  const customerRows = Array.from({ length: CUSTOMER_COUNT }, (_, i) => {
    const fullName = INDIAN_DEMO_NAMES[i % INDIAN_DEMO_NAMES.length]!;
    const accountNo = accountNumber(i + 1);
    return {
      fullName,
      email: `${accountNo.toLowerCase()}@demo.sentinelaml`,
      country: randomFrom(COUNTRIES),
      dob: randomDob(),
      accountNo,
    bankId: bankIds[i % bankIds.length],
    };
  });

  const customers = await db.insert(customersTable).values(customerRows).returning();
  console.log(`Created ${customers.length} customers`);

  const transactions: {
    senderId: string;
    receiverId: string;
    amount: string;
    currency: string;
    timestamp: Date;
    status: "clean" | "flagged" | "under_review";
  }[] = [];

  function randomTimestamp(): Date {
    const daysAgo = randomInt(0, 180);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(randomInt(0, 23), randomInt(0, 59));
    return d;
  }

  // 1. Baseline clean traffic — random pairs, modest amounts
  for (let i = 0; i < 260; i++) {
    const sender = randomFrom(customers);
    let receiver = randomFrom(customers);
    while (receiver.id === sender.id) receiver = randomFrom(customers);
    transactions.push({
      senderId: sender.id,
      receiverId: receiver.id,
      amount: randomInt(20, 4000).toFixed(2),
      currency: randomFrom(CURRENCIES),
      timestamp: randomTimestamp(),
      status: "clean",
    });
  }

  // 2. Circular chains (A -> B -> C -> A) — classic layering pattern
  const cycleGroups = 6;
  for (let g = 0; g < cycleGroups; g++) {
    const chainLength = randomInt(3, 5);
    const chain = Array.from({ length: chainLength }, () => randomFrom(customers));
    for (let i = 0; i < chain.length; i++) {
      const sender = chain[i]!;
      const receiver = chain[(i + 1) % chain.length]!;
      transactions.push({
        senderId: sender.id,
        receiverId: receiver.id,
        amount: randomInt(8000, 15000).toFixed(2),
        currency: "INR",
        timestamp: randomTimestamp(),
        status: "under_review",
      });
    }
  }

  // 3. Fan-out structuring: one account disperses to many just under reporting threshold
  const fanOutSources = 5;
  for (let f = 0; f < fanOutSources; f++) {
    const source = randomFrom(customers);
    const targets = new Set<string>();
    while (targets.size < randomInt(5, 8)) targets.add(randomFrom(customers).id);
    for (const targetId of targets) {
      if (targetId === source.id) continue;
      transactions.push({
        senderId: source.id,
        receiverId: targetId,
        amount: randomInt(9000, 9900).toFixed(2),
        currency: "INR",
        timestamp: randomTimestamp(),
        status: "flagged",
      });
    }
  }

  // 4. Fan-in aggregation: many accounts feed into one collector
  const fanInTargets = 5;
  for (let f = 0; f < fanInTargets; f++) {
    const target = randomFrom(customers);
    const sources = new Set<string>();
    while (sources.size < randomInt(5, 9)) sources.add(randomFrom(customers).id);
    for (const sourceId of sources) {
      if (sourceId === target.id) continue;
      transactions.push({
        senderId: sourceId,
        receiverId: target.id,
        amount: randomInt(9200, 9900).toFixed(2),
        currency: "INR",
        timestamp: randomTimestamp(),
        status: "flagged",
      });
    }
  }

  // 5. High-frequency / high-value single accounts
  const highActivityAccounts = 6;
  for (let h = 0; h < highActivityAccounts; h++) {
    const account = randomFrom(customers);
    for (let i = 0; i < randomInt(9, 14); i++) {
      let counterparty = randomFrom(customers);
      while (counterparty.id === account.id) counterparty = randomFrom(customers);
      const isSender = Math.random() > 0.5;
      transactions.push({
        senderId: isSender ? account.id : counterparty.id,
        receiverId: isSender ? counterparty.id : account.id,
        amount: randomInt(11000, 40000).toFixed(2),
        currency: randomFrom(["INR", "EUR"]),
        timestamp: randomTimestamp(),
        status: "flagged",
      });
    }
  }

  const inserted = await db.insert(transactionsTable).values(transactions).returning();
  console.log(`Created ${inserted.length} transactions`);

  // Notifications reflecting the most severe seeded activity
  await db.insert(notificationsTable).values([
    {
      title: "Circular transaction chain detected",
      message: "Multiple accounts formed a closed transaction loop indicative of layering.",
      severity: "critical",
      read: false,
    },
    {
      title: "Structuring pattern flagged",
      message: "An account dispersed funds across multiple recipients just under the $10,000 reporting threshold.",
      severity: "high",
      read: false,
    },
    {
      title: "High-frequency activity",
      message: "An account exceeded the transaction frequency threshold within a 24 hour window.",
      severity: "medium",
      read: false,
    },
  ]);

  console.log("Seed complete. Run POST /api/risk/recompute to score accounts and generate alerts.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
