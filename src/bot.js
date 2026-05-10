const { Client, IntentsBitField, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const logger = require('./logger/logger.js');
const gun_van = require('./modules/gun_van.js');
const tunables = require('./util/tunables.js');

// ✅ CHANNELS WHERE BOT SHOULD WORK
const CHANNEL_IDS = [
    '1471482924200362090',
    '1471192485303812351'
];

// (Optional) ✅ Role IDs allowed to trigger manually
// Leave empty [] if you don't want restriction
const ALLOWED_ROLE_IDS = [
    // 'ROLE_ID_HERE'
];

// Create Discord client
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ],
});

// 🇮🇳 Get IST Date (Day + Date only)
function getISTDate() {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return formatter.format(now);
}

// 🔥 SEND GUN VAN EMBED TO ALL CHANNELS
async function send_gun_van_embed() {
    try {
        // ✅ Always fetch fresh tunables FIRST before reading stock
        logger.info('Downloading latest tunables...');
        await tunables.download_tunables();
        logger.info('Tunables updated. Generating Gun Van data...');

        const data = gun_van.get_gun_van_data();
        const formattedIST = getISTDate();

        for (const id of CHANNEL_IDS) {
            try {
                const channel = await client.channels.fetch(id);

                const file = new AttachmentBuilder(data.imagePath, {
                    name: 'location.png'
                });

                const embed = new EmbedBuilder()
                    .setColor(0x070607)
                    .setTitle('🔫 Gun Van')
                    .setDescription(
                        `📅 **${formattedIST} (IST)**\n\n` +
                        data.message
                    )
                    .setImage('attachment://location.png')
                    .setFooter({ text: 'GTA Online Automated Feed' });

                await channel.send({
                    embeds: [embed],
                    files: [file]
                });

                logger.info(`Posted in channel: ${id}`);

            } catch (err) {
                logger.error(`Failed in channel ${id}:`, err);
            }
        }

        logger.info(`Gun Van posted successfully (Location #${data.locationIndex + 1})`);

    } catch (err) {
        logger.error('Failed to generate Gun Van embed:', err);
    }
}

// ⏰ Scheduled job (6 AM IST daily)
function setup_cron_jobs() {
    // Runs at 6:05 AM IST — 5 min after daily reset so tunables are live on Rockstar's servers
    cron.schedule('5 6 * * *', async () => {
        await send_gun_van_embed();
    }, {
        timezone: 'Asia/Kolkata'
    });
}

// ✅ Ready event
client.on('ready', async () => {
    logger.info(`Logged in as ${client.user.tag}. Bot is ready!`);
    console.log('Bot is online. Type !gun-van in allowed channels.');
    setup_cron_jobs();
});

// 🎮 Manual trigger (channel + optional role restriction)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Channel restriction
    if (!CHANNEL_IDS.includes(message.channel.id)) return;

    // Role restriction (if roles added)
    if (ALLOWED_ROLE_IDS.length > 0) {
        const hasRole = message.member.roles.cache.some(role =>
            ALLOWED_ROLE_IDS.includes(role.id)
        );
        if (!hasRole) return;
    }

    if (message.content.toLowerCase().trim() === '!gun-van') {
        logger.info(`Manual trigger in ${message.channel.id}`);
        await send_gun_van_embed();
    }
});

// 🔐 Login
client.login(process.env.BOT_TOKEN);