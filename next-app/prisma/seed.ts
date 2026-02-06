import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const conv1 = await prisma.conversation.create({
    data: {
      title: "Welcome to AIFA",
      model: "glm-4.7-flash",
    },
  });

  await prisma.message.createMany({
    data: [
      { conversationId: conv1.id, role: "user", content: "What can you help me with?" },
      {
        conversationId: conv1.id,
        role: "assistant",
        content:
          "I can help you with questions, writing, coding, and more. Try asking anything—or start a new chat from the sidebar.",
      },
    ],
  });

  await prisma.conversation.create({
    data: {
      title: "New Conversation",
      model: "glm-4.7-flash",
    },
  });

  console.log("Seed complete: 2 conversations, 2 messages in the first.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
