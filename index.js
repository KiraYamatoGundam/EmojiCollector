import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers]
});

const TOKEN = process.env.TOKEN;

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

// Déploiement de la commande sur tous les serveurs où le bot est présent
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user?.id || 'CLIENT_ID_PLACEHOLDER'), { body: commands });
        console.log('Commandes slash enregistrées.');
    } catch (err) {
        console.error(err);
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

client.login(TOKEN);
