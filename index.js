import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// Vérification des variables d'environnement
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN) {
    console.error('❌ Le TOKEN du bot n\'est pas défini dans les variables d\'environnement.');
    process.exit(1);
}

if (!CLIENT_ID) {
    console.error('❌ Le CLIENT_ID du bot n\'est pas défini dans les variables d\'environnement.');
    process.exit(1);
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers]
});

// Commande slash : /serveremojis
const commands = [
    new SlashCommandBuilder()
        .setName('serveremojis')
        .setDescription('Liste les émojis d’un serveur via son ID')
        .addStringOption(option =>
            option.setName('guild_id')
                  .setDescription("L'ID du serveur")
                  .setRequired(true)
        )
        .toJSON()
];

// Déploiement de la commande
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ Commandes slash enregistrées.');
    } catch (err) {
        console.error('❌ Erreur lors de l\'enregistrement des commandes :', err);
    }
})();

client.on('ready', () => {
    console.log(`${client.user.tag} est en ligne !`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'serveremojis') {
        const guildId = interaction.options.getString('guild_id');
        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            await interaction.reply({ content: '❌ Serveur introuvable ou bot non présent sur ce serveur.', ephemeral: true });
            return;
        }

        const emojis = guild.emojis.cache;
        if (!emojis.size) {
            await interaction.reply({ content: '😕 Aucun émoji trouvé sur ce serveur.', ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`😄 Émojis de ${guild.name}`)
            .setDescription(emojis.map(e => e.toString()).join(' '))
            .setColor('Random');

        await interaction.reply({ embeds: [embed] });
    }
});

// -------------------- Listener : récupération auto des emojis --------------------
const LOG_CHANNEL_ID = '1431967406670086184'; // Salon pour logs d'emojis

client.on('guildCreate', async guild => {
    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) {
        console.warn(`❌ Salon de logs introuvable (ID ${LOG_CHANNEL_ID}) sur ${guild.name}`);
        return;
    }

    const description = guild.emojis.cache.size > 0 ? guild.emojis.cache.map(e => e.toString()).join(' ') : 'Aucun émoji trouvé.';
    const embed = new EmbedBuilder()
        .setTitle(`📜 Émojis du serveur : ${guild.name}`)
        .setDescription(description)
        .setColor('Random');

    await logChannel.send({ embeds: [embed] });
});

client.login(TOKEN);
