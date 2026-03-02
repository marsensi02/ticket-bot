const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');

//const TOKEN = 'MTQ3NzM2NTk3MzIxMTI4NzYwMw.GSJ4p8.Wrc7r4qC8SbDUUal0Qw-TKOGG1gaJcJl0mSYMw';

const TOKEN = process.env.TOKEN;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let ticketData = {};

client.once('ready', () => {
    console.log(`Bot aktif sebagai ${client.user.tag}`);
});


// =========================
// GENERATE DASHBOARD
// =========================
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

    const row = new ActionRowBuilder()
        .addComponents(
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


// =========================
// HANDLE BUTTON CLICK
// =========================
client.on('interactionCreate', async interaction => {

    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    const username = interaction.user.username;

    if (!ticketData[userId]) {
        ticketData[userId] = {
            username: username,
            sendback: 0,
            keep: 0
        };
    }

    if (interaction.customId === 'sendback') {
        ticketData[userId].sendback++;
    }

    if (interaction.customId === 'keep') {
        ticketData[userId].keep++;
    }

    await interaction.update(generateDashboard());
});


// =========================
// COMMAND UNTUK BUAT DASHBOARD
// =========================
client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ticket') {
        await interaction.reply(generateDashboard());
    }
});


client.login(TOKEN);