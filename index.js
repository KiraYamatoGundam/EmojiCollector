import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js';

// -------------------- CONFIGURATION --------------------
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers]
});

const TOKEN = process.env.TOKEN; // Token du bot dans .env
const LOG_CHANNEL_ID = '1431967406670086184'; // ID du salon où envoyer les logs emojis

if (!TOKEN) {
    console.error("❌ Le token du bot n'est pas défini ! Vérifie ton .env");
    process.exit(1);
}

// -------------------- COMMANDES SLASH --------------------
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

const rest = new REST({ version: '10' }).setToken(TOKEN);

// Déploiement des commandes slash
client.once('ready', async () => {
    console.log(`${client.user.tag} est en ligne !`);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('✅ Commandes slash enregistrées.');
    } catch (err) {
        console.error('❌ Erreur lors de l\'enregistrement des commandes :', err);
    }
});

// -------------------- GESTION DES COMMANDES --------------------
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
            .setColor(Colors.Random);

        await interaction.reply({ embeds: [embed] });
    }
});

// -------------------- LISTENER : RÉCUPÉRATION AUTOMATIQUE --------------------
client.on('guildCreate', async guild => {
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) {
        console.log(`❌ Salon de logs introuvable (ID ${LOG_CHANNEL_ID})`);
        return;
    }

    const emojis = guild.emojis.cache;
    const description = emojis.size ? emojis.map(e => e.toString()).join(' ') : 'Aucun émoji trouvé.';

    const embed = new EmbedBuilder()
        .setTitle(`📜 Émojis du serveur : ${guild.name}`)
        .setDescription(description)
        .setColor(Colors.Random)
        .setTimestamp()
        .setFooter({ text: `ID du serveur : ${guild.id}` });

    await logChannel.send({ embeds: [embed] });
});

// -------------------- LOGIN --------------------
client.login(TOKEN);
