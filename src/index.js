require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const { getUser, setPremium } = require('./database');
const { createPixPayment, payment } = require('./mercadopago');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();

app.use(express.json());

// ------------------- COMANDOS DO BOT ------------------- //

// Menu Inicial (Gratuito)
bot.start(async (ctx) => {
  const user = await getUser(ctx.from.id);
  const status = user.is_premium ? '🌟 Usuário VIP / Premium' : '👤 Plano Gratuito';

  ctx.reply(
    `👋 **Bem-vindo ao TechnoAbyss Intelligence Bot!**\n\n` +
    `Seu Status: **${status}**\n\n` +
    `📌 **Recursos Gratuitos:**\n` +
    `/cotacao - Cotação de Cripto e Dólar em tempo real\n` +
    `/alerta_free - Alertas básicos do mercado\n\n` +
    `🚀 **Recursos PREMIUM (Sinal VIP & Análise com IA):**\n` +
    `/premium_info - Descubra os benefícios\n` +
    `/assinar - Assine por R$ 29,90/mês e libere acesso instantâneo!`,
    { parse_mode: 'Markdown' }
  );
});

// Recurso Grátis
bot.command('cotacao', (ctx) => {
  ctx.reply('📊 **[FREE] Cotação Atual:**\n• Bitcoin: $63,400\n• Ethereum: $3,450\n• Dólar: R$ 5,45');
});

// Exemplo de Bloqueio Paywall (Recurso Premium)
bot.command('analise_ia', async (ctx) => {
  const user = await getUser(ctx.from.id);

  if (!user.is_premium) {
    return ctx.reply(
      '🔒 **Acesso Negado!**\n\nA ferramenta de Análise Preditiva por IA é exclusiva para assinantes **Premium**.\n\nUse o comando /assinar para liberar agora mesmo por PIX!'
    );
  }

  ctx.reply('🤖 **[PREMIUM] Relatório Diário de IA:** Oportunidade de Arbitragem detectada em par BTC/USDT com retorno previsto de +2.4%.');
});

// Comando de Assinatura via PIX
bot.command('assinar', async (ctx) => {
  try {
    ctx.reply('⏳ Gerando seu código PIX seguro via Mercado Pago...');
    
    const pix = await createPixPayment(ctx.from.id);

    await ctx.replyWithPhoto({ source: Buffer.from(pix.qrCodeBase64, 'base64') }, {
      caption: `✅ **PIX Gerado com Sucesso!**\n\nCopie o código abaixo e pague no app do seu banco:\n\n\`${pix.qrCode}\`\n\n*Assim que o pagamento for confirmado, seu acesso Premium será liberado automaticamente!*`,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    ctx.reply('❌ Ocorreu um erro ao gerar a cobrança. Tente novamente em instantes.');
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
        
        // Ativa premium no banco de dados por 30 dias
        await setPremium(telegramId, 30);

        // Notifica o cliente via Telegram
        await bot.telegram.sendMessage(
          telegramId,
          '🎉 **PAGAMENTO CONFIRMADO!**\n\nSeu acesso **Premium** foi ativado por 30 dias! Aproveite todos os recursos avançados de IA e Sinais usando o comando /analise_ia.',
          { parse_mode: 'Markdown' }
        );
      }
    } catch (error) {
      console.error('Erro ao processar Webhook MP:', error);
    }
  }

  res.sendStatus(200);
});

// ------------------- INICIALIZAÇÃO ------------------- //

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  // Inicia o bot do Telegram via Polling
  bot.launch();
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
