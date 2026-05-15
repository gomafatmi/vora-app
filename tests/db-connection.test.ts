import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

describe("Database Connection", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    prisma = new PrismaClient({ adapter });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should connect to PostgreSQL and create a session", async () => {
    const session = await prisma.session.create({
      data: {
        locale: "en",
        mode: "anonymous",
      },
    });
    expect(session.id).toBeDefined();
    expect(session.locale).toBe("en");
    expect(session.mode).toBe("anonymous");
    expect(session.currentProblem).toBeNull();

    await prisma.session.delete({ where: { id: session.id } });
  });

  it("should create a user with a session", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@vora.app",
        name: "Test User",
        sessions: {
          create: {
            locale: "fr",
            mode: "authenticated",
          },
        },
      },
      include: { sessions: true },
    });

    expect(user.email).toBe("test@vora.app");
    expect(user.sessions).toHaveLength(1);
    expect(user.sessions[0]!.locale).toBe("fr");

    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  it("should create messages and crisis alerts in a session", async () => {
    const session = await prisma.session.create({
      data: {
        locale: "en",
        mode: "anonymous",
        messages: {
          create: [
            { role: "user", content: "I feel anxious" },
            { role: "assistant", content: "Tell me more", problemDomain: "anxiety" },
          ],
        },
        crisisAlerts: {
          create: {
            level: "high",
            message: "User expressed suicidal thoughts",
            resolved: false,
          },
        },
      },
      include: { messages: true, crisisAlerts: true },
    });

    expect(session.messages).toHaveLength(2);
    expect(session.crisisAlerts).toHaveLength(1);
    expect(session.crisisAlerts[0]!.level).toBe("high");

    await prisma.crisisAlert.deleteMany({ where: { sessionId: session.id } });
    await prisma.message.deleteMany({ where: { sessionId: session.id } });
    await prisma.session.delete({ where: { id: session.id } });
  });

  it("should query messages by problem domain", async () => {
    const session = await prisma.session.create({
      data: {
        locale: "en",
        mode: "anonymous",
        messages: {
          create: [
            { role: "user", content: "I lost my job", problemDomain: "stress" },
            { role: "assistant", content: "That sounds tough", problemDomain: "stress" },
          ],
        },
      },
      include: { messages: true },
    });

    const stressMessages = await prisma.message.findMany({
      where: { problemDomain: "stress" },
    });

    expect(stressMessages.length).toBeGreaterThanOrEqual(2);

    await prisma.message.deleteMany({ where: { sessionId: session.id } });
    await prisma.session.delete({ where: { id: session.id } });
  });
});
