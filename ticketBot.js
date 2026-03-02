import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, REST, Routes, SlashCommandBuilder } from "discord.js";

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let ticketData = {};

// =======================
// AUTO REGISTER COMMAND
// =======================
async function registerCommands() {

    const commands = [
        new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Menampilkan Ticket Candy Dashboard")
        .toJSON()
    ];

    const rest = new REST({
        version: "10"
    }).setToken(TOKEN);

    try {
        console.log("Mendaftarkan slash command...");

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands
        });

        console.log("Slash command berhasil didaftarkan!");
    } catch (error) {
        console.error("Gagal daftar command:", error);
    }
}

// =======================
// DASHBOARD
// =======================
function generateDashboard() {

    let sendbackUsers = [];
    let keepUsers = [];
    let wbUsers = [];

    Object.values(ticketData).forEach(user => {
        if (user.choice === "sendback")
            sendbackUsers.push(user.username);
        if (user.choice === "keep")
            keepUsers.push(user.username);
        if (user.choice === "wb")
            wbUsers.push(user.username);
    });

    const description = `
🔴 **Sendback Ticket (${sendbackUsers.length})**
${sendbackUsers.length ? sendbackUsers.map(u => `• ${u}`).join("\n") : "Belum ada"}

🟢 **Keep Ticket (${keepUsers.length})**
${keepUsers.length ? keepUsers.map(u => `• ${u}`).join("\n") : "Belum ada"}

🔵 **Sudah Ambil Ticket (WB) (${wbUsers.length})**
${wbUsers.length ? wbUsers.map(u => `• ${u}`).join("\n") : "Belum ada"}
`;

    const embed = new EmbedBuilder()
        .setTitle("🎟 TICKET CANDY DASHBOARD")
        .setDescription(description)
        .setColor(0xf39c12);

    const row = new ActionRowBuilder().addComponents(
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
            .setEmoji("🔵"));

    return {
        embeds: [embed],
        components: [row]
    };
}

// =======================
// BOT READY
// =======================
client.once(Events.ClientReady, async() => {
    console.log(`Bot aktif sebagai ${client.user.tag}`);
    await registerCommands();
});

// =======================
// INTERACTION HANDLER
// =======================
client.on(Events.InteractionCreate, async interaction => {

    // Slash command
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === "ticket") {
            await interaction.reply(generateDashboard());
        }
    }

    // Button
    if (interaction.isButton()) {

        const userId = interaction.user.id;
        const username = interaction.user.username;

        if (!ticketData[userId]) {
            ticketData[userId] = {
                username,
                choice: null
            };
        }

        if (interaction.customId === "sendback") {
            ticketData[userId].choice = "sendback";
        }

        if (interaction.customId === "keep") {
            ticketData[userId].choice = "keep";
        }

        if (interaction.customId === "wb") {
            ticketData[userId].choice = "wb";
        }

        await interaction.update(generateDashboard());
    }
});

client.login(TOKEN);