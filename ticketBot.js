import fs from "fs";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} from "discord.js";

const TOKEN = process.env.TOKEN;
const ADMIN_ROLE_ID = "1407380518772805753";
const DATA_FILE = "./tickets.json";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ============================
// STORAGE SYSTEM
// ============================

let ticketData = {};

if (fs.existsSync(DATA_FILE)) {
  ticketData = JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(ticketData, null, 2));
}

// ============================
// HELPER FUNCTIONS
// ============================

function isAdmin(member) {
  return member.roles.cache.has(ADMIN_ROLE_ID);
}

function categorizeData() {
  const sendback = [];
  const keep = [];
  const wb = [];

  Object.values(ticketData).forEach(user => {
    if (user.choice === "sendback") sendback.push(user.name);
    if (user.choice === "keep") keep.push(user.name);
    if (user.choice === "wb") wb.push(user.name);
  });

  return { sendback, keep, wb };
}

// ============================
// DASHBOARD
// ============================

function generateDashboard() {

  const { sendback, keep, wb } = categorizeData();

  const description = `
🔴 **Sendback Ticket (${sendback.length})**
${sendback.length ? sendback.map(u => `• ${u}`).join("\n") : "Belum ada"}

🟢 **Keep Ticket (${keep.length})**
${keep.length ? keep.map(u => `• ${u}`).join("\n") : "Belum ada"}

🔵 **Sudah Ambil Ticket (WB) (${wb.length})**
${wb.length ? wb.map(u => `• ${u}`).join("\n") : "Belum ada"}
`;

  const embed = new EmbedBuilder()
    .setTitle("🎟 TICKET CANDY DASHBOARD")
    .setDescription(description)
    .setColor(0xf39c12);

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("sendback")
      .setLabel("Sendback Ticket")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId("keep")
      .setLabel("Keep Ticket")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("wb")
      .setLabel("Sudah Ambil Ticket (WB)")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🔵")
  );

  return { embeds: [embed], components: [buttons] };
}

// ============================
// READY EVENT + AUTO REGISTER
// ============================

client.once("ready", async () => {
  console.log(`Bot aktif sebagai ${client.user.tag}`);

  await client.application.commands.set([
    {
      name: "ticket",
      description: "Menampilkan dashboard ticket"
    },
    {
      name: "addticket",
      description: "Tambah user manual (Admin only)",
      options: [
        {
          name: "nama",
          description: "Nama user manual",
          type: 3,
          required: true
        },
        {
          name: "kategori",
          description: "Pilih kategori",
          type: 3,
          required: true,
          choices: [
            { name: "Sendback", value: "sendback" },
            { name: "Keep", value: "keep" },
            { name: "Sudah Ambil (WB)", value: "wb" }
          ]
        }
      ]
    },
    {
      name: "removeticket",
      description: "Hapus user dari dashboard (Admin only)",
      options: [
        {
          name: "nama",
          description: "Nama yang ingin dihapus",
          type: 3,
          required: true
        }
      ]
    },
    {
      name: "resetticket",
      description: "Reset semua ticket (Admin only)"
    }
  ]);
});

// ============================
// INTERACTION HANDLER
// ============================

client.on("interactionCreate", async interaction => {

  // =====================
  // SLASH COMMAND
  // =====================
  if (interaction.isChatInputCommand()) {

    // /ticket
    if (interaction.commandName === "ticket") {
      return interaction.reply(generateDashboard());
    }

    // ADMIN CHECK
    if (!isAdmin(interaction.member)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki akses admin.",
        ephemeral: true
      });
    }

    // /addticket
    if (interaction.commandName === "addticket") {

      const nama = interaction.options.getString("nama");
      const kategori = interaction.options.getString("kategori");

      const manualId = `manual_${nama.toLowerCase()}`;

      ticketData[manualId] = {
        name: nama,
        choice: kategori
      };

      saveData();

      return interaction.reply({
        content: `✅ ${nama} berhasil ditambahkan.`,
        ephemeral: true
      });
    }

    // /removeticket
    if (interaction.commandName === "removeticket") {

      const nama = interaction.options.getString("nama").toLowerCase();

      const key = Object.keys(ticketData).find(id =>
        ticketData[id].name.toLowerCase() === nama
      );

      if (!key) {
        return interaction.reply({
          content: "❌ Nama tidak ditemukan.",
          ephemeral: true
        });
      }

      delete ticketData[key];
      saveData();

      return interaction.reply({
        content: `🗑 ${nama} berhasil dihapus.`,
        ephemeral: true
      });
    }

    // /resetticket
    if (interaction.commandName === "resetticket") {

      ticketData = {};
      saveData();

      return interaction.reply({
        content: "♻ Semua ticket berhasil direset.",
        ephemeral: true
      });
    }
  }

  // =====================
  // BUTTON HANDLER
  // =====================
  if (interaction.isButton()) {

    const userId = interaction.user.id;
    const displayName = interaction.member.displayName;

    ticketData[userId] = {
      name: displayName,
      choice: interaction.customId
    };

    saveData();

    return interaction.update(generateDashboard());
  }
});

client.login(TOKEN);