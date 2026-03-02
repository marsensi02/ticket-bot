import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events
} from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;

let ticketData = {};

client.once(Events.ClientReady, () => {
  console.log(`Bot aktif sebagai ${client.user.tag}`);
});

function generateDashboard() {

  let description = "";

  const users = Object.values(ticketData);

  if (users.length === 0) {
    description = "Belum ada data ticket.";
  } else {

    users.sort((a, b) =>
      (b.sendback + b.keep) - (a.sendback + a.keep)
    );

    description = users.map((u, i) => {
      const total = u.sendback + u.keep;
      return `${i + 1}. **${u.username}** → 🔴 ${u.sendback} | 🟢 ${u.keep} | Total: ${total}`;
    }).join("\n");
  }

  const embed = new EmbedBuilder()
    .setTitle("🎟 TICKET CANDY DASHBOARD")
    .setDescription(description)
    .setColor(0xf39c12);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('sendback')
      .setLabel('Sendback Ticket')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId('keep')
      .setLabel('Keep Ticket')
      .setStyle(ButtonStyle.Success)
  );

  return {
    embeds: [embed],
    components: [row]
  };
}

client.on(Events.InteractionCreate, async interaction => {

  if (interaction.isButton()) {

    const userId = interaction.user.id;
    const username = interaction.user.username;

    if (!ticketData[userId]) {
      ticketData[userId] = {
        username,
        sendback: 0,
        keep: 0
      };
    }

    if (interaction.customId === "sendback") {
      ticketData[userId].sendback++;
    }

    if (interaction.customId === "keep") {
      ticketData[userId].keep++;
    }

    await interaction.update(generateDashboard());
  }
});

client.login(TOKEN);