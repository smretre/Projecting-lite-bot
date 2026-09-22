const { MercadoPagoConfig, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

const payment = new Payment(client);

async function createPixPayment(telegramId) {
  try {
    const result = await payment.create({
      body: {
        transaction_amount: 29.90, // Valor da assinatura mensal
        description: 'Assinatura Mensal - Bot Premium TechnoAbyss',
        payment_method_id: 'pix',
        payer: {
          email: `user_${telegramId}@technoabyss.com`,
          first_name: `User_${telegramId}`
        },
        external_reference: String(telegramId),
        notification_url: `${process.env.PUBLIC_URL}/webhook/mercadopago`
      }
    });

    const pixData = result.point_of_interaction.transaction_data;
    return {
      paymentId: result.id,
      qrCode: pixData.qr_code,
      qrCodeBase64: pixData.qr_code_base64
    };
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    throw error;
  }
}

module.exports = { createPixPayment, payment };
