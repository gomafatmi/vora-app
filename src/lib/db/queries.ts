import { prisma } from "./client";

export async function createSession(data: {
  userId?: string;
  locale: string;
  mode: "anonymous" | "authenticated";
}) {
  return prisma.session.create({
    data: {
      userId: data.userId,
      locale: data.locale,
      mode: data.mode,
    },
  });
}

export async function getSession(sessionId: string) {
  return prisma.session.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function saveMessage(data: {
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  problemDomain?: string;
  crisisLevel?: string;
}) {
  return prisma.message.create({ data });
}

export async function saveCrisisAlert(data: {
  sessionId: string;
  level: string;
  message: string;
  resolved: boolean;
}) {
  return prisma.crisisAlert.create({ data });
}

export async function updateSessionProblem(
  sessionId: string,
  problemDomain: string
) {
  return prisma.session.update({
    where: { id: sessionId },
    data: { currentProblem: problemDomain },
  });
}
