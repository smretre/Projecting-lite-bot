require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const { getUser, setPremium } = require('./database');
const { createPixPayment, payment } = require('./mercadopago');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();

// Registra a lista oficial de comandos unificada no menu do Telegram
bot.telegram.setMyCommands([
  { command: 'start', description: 'Painel principal e status da conta' },
  { command: 'cotacao', description: 'Monitor de cripto e dólar em tempo real' },
  { command: 'alertafree', description: 'Boletim diário de tendências globais' },
  { command: 'suporte', description: 'Central de atendimento e FAQ' },
  { command: 'analiseia', description: '🔒 Relatório de IA e Arbitragem (VIP)' },
  { command: 'sinaisvip', description: '🔒 Sinais de alta assertividade (VIP)' },
  { command: 'materialvip', description: '🔒 Downloads e templates exclusivos (VIP)' },
  { command: 'assinar', description: '💎 Desbloquear acesso VIP via PIX' }
]);

app.use(express.json());

// ------------------- UTILITÁRIOS & FORMATAÇÃO ------------------- //
const formatExpiryDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('pt-BR');
};

// ------------------- COMANDOS DO BOT ------------------- //

// Menu Inicial com Imagem Institucional de Alto Impacto
bot.start(async (ctx) => {
  const user = await getUser(ctx.from.id);
  const isVip = user.is_premium;
  const statusText = isVip ? '🌟 **Membro VIP Ativo**' : '👤 **Plano Gratuito**';

  // URL de uma imagem corporativa de alta qualidade (pode substituir por uma imagem hospedada sua)
  const bannerUrl = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1000&auto=format&fit=crop';

  const captionText = 
    `🤖 **TECHNOABYSS INTELLIGENCE CORE**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Ecossistema Avançado de Inteligência Financeira & Sinais\n\n` +
    `👤 **Usuário:** \`${ctx.from.first_name}\`\n` +
    `📊 **Status Atual:** ${statusText}\n\n` +
    `📌 **RECURSOS GRATUITOS:**\n` +
    `• /cotacao - Monitor de ativos e câmbio em tempo real\n` +
    `• /alertafree - Boletim diário de tendências globais\n` +
    `• /suporte - Canais de atendimento oficiais\n\n` +
    `🚀 **ÁREA EXCLUSIVA PREMIUM (VIP):**\n` +
    `• /analiseia - Inteligência Preditiva e Arbitragem\n` +
    `• /sinaisvip - Sinais de Alta Assertividade (DeFi/Crypto)\n` +
    `• /materialvip - Downloads de E-books e Templates\n\n` +
    `💎 **ASSINATURA CORPORATIVA:**\n` +
    `• /assinar - Desbloqueie todo o acervo por apenas **R$ 29,90/mês**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  try {
    await ctx.replyWithPhoto(bannerUrl, {
      caption: captionText,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    // Fallback caso ocorra erro ao carregar a imagem externa
    await ctx.reply(captionText, { parse_mode: 'Markdown' });
  }
});

// Recurso Grátis 1: Cotações
bot.command('cotacao', (ctx) => {
  ctx.reply(
    `📊 **MONITOR DE MERCADO EM TEMPO REAL**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• **Bitcoin (BTC):** \`$64,120.00\` (+1.8%)\n` +
    `• **Ethereum (ETH):** \`$3,510.50\` (+0.9%)\n` +
    `• **Dólar Comercial:** \`R$ 5,42\` (-0.3%)\n` +
    `• **Gas Fee (Ethereum):** \`18 Gwei\`\n\n` +
    `💡 *Dica: Assine o /assinar para desbloquear análises preditivas avançadas.*`,
    { parse_mode: 'Markdown' }
  );
});

// Recurso Grátis 2: Alertas Básicos (Suporta alerta_free e alertafree)
bot.command(['alerta_free', 'alertafree'], (ctx) => {
  ctx.reply(
    `📢 **BOLETIM INFORMATIVO GLOBAL**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• Mercado consolidando em faixa de suporte institucional importante.\n` +
    `• Bancos Centrais mantêm cautela sobre projeções de liquidez.\n` +
    `• Volatilidade esperada para os próximos dias devido a relatórios macroeconômicos.\n\n` +
    `⚡ *Para receber sinais em tempo real, utilize o comando /assinar.*`,
    { parse_mode: 'Markdown' }
  );
});

// Recurso Grátis 3: Suporte
bot.command('suporte', (ctx) => {
  ctx.reply(
    `🛠️ **CENTRAL DE ATENDIMENTO TECHNOABYSS**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Precisa de suporte técnico ou assistência com sua assinatura?\n\n` +
    `• **Canal Oficial:** @TechnoAbyss\n` +
    `• **Atendimento Humano:** @SuporteTechnoAbyss\n` +
    `• **Tempo Médio de Resposta:** Até 2 horas úteis.\n\n` +
    `_Nosso sistema de pagamento via PIX é 100% automatizado e instantâneo._`,
    { parse_mode: 'Markdown' }
  );
});

// ------------------- RECURSOS PREMIUM (COM PAYWALL) ------------------- //

// Premium 1: Análise Preditiva por IA
bot.command(['analise_ia', 'analiseia'], async (ctx) => {
  const user = await getUser(ctx.from.id);

  if (!user.is_premium) {
    return ctx.reply(
      `🔒 **ACESSO RESTRITO - PAYWALL CORPORATIVO**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `A ferramenta de **Análise Preditiva por Inteligência Artificial** é exclusiva para membros assinantes.\n\n` +
      `Eleve o nível das suas operações agora mesmo por apenas **R$ 29,90/mês**:\n` +
      `/assinar`,
      { parse_mode: 'Markdown' }
    );
  }

  ctx.reply(
    `🤖 **[RELATÓRIO DE IA] - SINAL DE ARBITRAGEM**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• **Ativo Alvo:** BTC / USDT\n` +
    `• **Tendência Identificada:** Alta probabilidade de rompimento em D1.\n` +
    `• **Retorno Estimado:** +3.4% em 48h.\n` +
    `• **Nível de Confiança da IA:** 94.2%\n\n` +
    `⚠️ *Execute suas operações com base em sua própria gestão de risco.*`,
    { parse_mode: 'Markdown' }
  );
});

// Premium 2: Sinais VIP de Alta Assertividade
bot.command(['sinais_vip', 'sinaisvip'], async (ctx) => {
  const user = await getUser(ctx.from.id);

  if (!user.is_premium) {
    return ctx.reply(
      `🔒 **CONTEÚDO EXCLUSIVO VIP**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Os sinais de alta assertividade são restritos a assinantes ativos do plano corporativo.\n\n` +
      `Garanta seu acesso imediato com liberação automática via PIX usando /assinar.`,
      { parse_mode: 'Markdown' }
    );
  }

  ctx.reply(
    `🚀 **[SINAL VIP EXCLUSIVO]**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• **Par:** ETH / USDC (DeFi Pool)\n` +
    `• **Oportunidade:** Ineficiência de liquidez detetada na DEX.\n` +
    `• **Ação Recomendada:** Alocação tática de curto prazo.\n` +
    `• **Target de Lucro:** 4.8% APY ajustado.`,
    { parse_mode: 'Markdown' }
  );
});

// Premium 3: Materiais e Downloads VIP
bot.command(['material_vip', 'materialvip'], async (ctx) => {
  const user = await getUser(ctx.from.id);

  if (!user.is_premium) {
    return ctx.reply(
      `🔒 **BIBLIOTECA VIP BLOQUEADA**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Planilhas avançadas, templates de automação e e-books são restritos a assinantes.\n\n` +
      `Digite /assinar para desbloquear todo o acervo imediatamente.`,
      { parse_mode: 'Markdown' }
    );
  }

  ctx.reply(
    `📂 **[CENTRAL DE DOWNLOADS VIP]**\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Aqui estão seus recursos exclusivos deste mês:\n\n` +
    `• 📥 [Baixar Template n8n / Automação BaaS](https://t.me/TechnoAbyss)\n` +
    `• 📥 [Planilha Avançada de Gestão Patrimonial](https://t.me/TechnoAbyss)\n` +
    `• 📥 [Guia Definitivo de Engenharia Fiscal](https://t.me/TechnoAbyss)\n\n` +
    `_Novos arquivos adicionados toda segunda-feira._`,
    { parse_mode: 'Markdown' }
  );
});

// ------------------- CHECKOUT AUTOMÁTICO (PIX) ------------------- //

bot.command('assinar', async (ctx) => {
  try {
    await ctx.reply('⏳ **Processando:** Conectando com o gateway seguro do Mercado Pago...');
    
    const pix = await createPixPayment(ctx.from.id);

    await ctx.replyWithPhoto(
      { source: Buffer.from(pix.qrCodeBase64, 'base64') }, 
      {
        caption: 
          `💎 **FATURA GERADA COM SUCESSO!**\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `• **Plano:** Assinatura Mensal VIP (30 Dias)\n` +
          `• **Valor:** R$ 29,90\n\n` +
          `📋 **PIX COPIA E COLA:**\n` +
          `\`${pix.qrCode}\`\n\n` +
          `⚡ *O sistema reconhece o pagamento instantaneamente e libera o seu acesso VIP de forma 100% automatizada!*`,
        parse_mode: 'Markdown'
      }
    );
  } catch (err) {
    console.error('Erro ao gerar PIX:', err);
    await ctx.reply('❌ **Erro de Comunicação:** Não foi possível gerar a cobrança no momento. Tente novamente em instantes.');
  }
});

// ------------------- WEBHOOK MERCADO PAGO ------------------- //

app.post('/webhook/mercadopago', async (req, res) => {
  const { type, data } = req.body;

  if (type === 'payment' || req.query.type === 'payment') {
    const paymentId = data ? data.id : req.query['data.id'];

    try {
      const paymentInfo = await payment.get({ id: paymentId });

      if (paymentInfo.status === 'approved') {
        const telegramId = Number(paymentInfo.external_reference);
        const subscriptionDays = 30;
        
        // Ativa o plano premium no banco de dados local
        await setPremium(telegramId, subscriptionDays);

        // Notifica o cliente instantaneamente no chat privado
        await bot.telegram.sendMessage(
          telegramId,
          `🎉 **PAGAMENTO APROVADO COM SUCESSO!**\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Parabéns! Sua assinatura **VIP** foi ativada por **${subscriptionDays} dias**.\n\n` +
          `🔓 **Todos os recursos avançados foram liberados:**\n` +
          `• /analiseia - Relatórios e sinais preditivos\n` +
          `• /sinaisvip - Oportunidades de mercado\n` +
          `• /materialvip - Downloads e templates\n\n` +
          `Aproveite ao máximo o seu novo painel corporativo!`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (error) {
      console.error('❌ Erro crítico ao processar Webhook do Mercado Pago:', error);
    }
  }

  res.sendStatus(200);
});

// ------------------- INICIALIZAÇÃO DO SERVIDOR ------------------- //

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Servidor corporativo rodando na porta ${PORT}`);
  bot.launch();
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
