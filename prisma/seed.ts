import "dotenv/config"
import { PrismaClient, ProjectStatus, UserRole } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import bcrypt from "bcryptjs"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const teamMembers = [
  { name: "Sarah Chen", email: "sarah.chen@dimovtax.com" },
  { name: "Marcus Webb", email: "marcus.webb@dimovtax.com" },
  { name: "Elena Rodriguez", email: "elena.rodriguez@dimovtax.com" },
  { name: "David Kim", email: "david.kim@dimovtax.com" },
  { name: "Priya Sharma", email: "priya.sharma@dimovtax.com" },
  { name: "James O'Brien", email: "james.obrien@dimovtax.com" },
  { name: "Yuki Tanaka", email: "yuki.tanaka@dimovtax.com" },
  { name: "Amara Okafor", email: "amara.okafor@dimovtax.com" },
]

const projectNames = [
  "Website Redesign",
  "Mobile App MVP",
  "Payment Gateway Integration",
  "Q4 Marketing Campaign",
  "Data Warehouse Migration",
  "Customer Portal Launch",
  "API v2 Refactor",
  "Brand Identity Refresh",
  "Internal HR Tooling",
  "Analytics Dashboard",
  "Email Automation Flow",
  "Security Audit & Hardening",
  "Onboarding Revamp",
  "Inventory Sync System",
  "Localization Rollout",
]

const descriptions = [
  "Complete overhaul of the marketing site with a new design system and CMS integration.",
  "Build a cross-platform mobile app targeting iOS and Android for the first release.",
  "Integrate Stripe and PayPal with unified webhook handling and reconciliation.",
  "Multi-channel campaign covering social, email, and paid search for the holiday season.",
  "Move nightly ETL jobs from the legacy warehouse to Snowflake with zero downtime.",
  "Self-service portal for customers to manage subscriptions, invoices, and support tickets.",
  "Split the monolithic API into domain services with shared auth and rate limiting.",
  "New logo, typography, and component library rolled out across all touchpoints.",
  "Replace spreadsheets with a lightweight internal app for leave requests and reviews.",
  "Real-time KPI dashboard with drill-downs and exportable reports for leadership.",
  "Triggered email sequences for onboarding, churn prevention, and win-back flows.",
  "Penetration testing, dependency upgrades, and OWASP compliance across all services.",
  "Redesign the first-run experience to reduce time-to-value and drop-off.",
  "Two-way sync between the ERP and the storefront with conflict resolution.",
  "Translate the app into French, German, and Japanese with locale-aware formatting.",
]

function randomDate(monthsAhead: number): Date {
  const now = new Date()
  const future = new Date(now.setMonth(now.getMonth() + monthsAhead))
  future.setDate(Math.floor(Math.random() * 28) + 1)
  return future
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@dimovtax.com" },
    update: {},
    create: {
      name: "Ali Naqi",
      email: "admin@dimovtax.com",
      password: passwordHash,
      role: UserRole.admin,
    },
  })

  const memberPasswordHash = await bcrypt.hash("member123", 10)
  const users = await Promise.all(
    teamMembers.map((member) =>
      prisma.user.upsert({
        where: { email: member.email },
        update: {},
        create: {
          name: member.name,
          email: member.email,
          password: memberPasswordHash,
          role: UserRole.member,
        },
      }),
    ),
  )

  const existingProjects = await prisma.project.count()
  if (existingProjects > 0) {
    console.log(`Database already has ${existingProjects} project(s). Skipping project seed.`)
    console.log(`Seed complete (users upserted, projects skipped).`)
    return
  }

  await prisma.project.createMany({
    data: projectNames.map((name, i) => {
      const status =
        i < 5 ? ProjectStatus.active : i < 10 ? ProjectStatus.on_hold : ProjectStatus.completed
      const monthsAhead =
        status === ProjectStatus.completed
          ? -Math.floor(Math.random() * 6) - 1
          : Math.floor(Math.random() * 8) + 1

      return {
        name,
        description: descriptions[i],
        status,
        deadline: randomDate(monthsAhead),
        assigneeId: pick(users).id,
        budget: Math.floor(Math.random() * 80000 + 5000),
        ownerId: admin.id,
      }
    }),
  })

  console.log(`Seeded ${projectNames.length} projects, 1 admin, and ${teamMembers.length} team members.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
