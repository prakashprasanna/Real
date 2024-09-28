import express from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import cors from 'cors';
       
dotenv.config();
const port =3000;
const app = express();
const publishableKey = 'pk_test_51Q0KewLN1sWuQDkGPMtzTZVYJ0HB2AJppDVIHGwZlTw6BJ5YXzhh5X8Rf2GpqsFzLMDONVoJYsh0pklNEoQK8vDM00YY4xJfWP';
const secretKey = 'sk_test_51Q0KewLN1sWuQDkGSWiX2DRR35Y3gcY3n87EtJmNAE2yefG3Vd23jOPv1O47CH84r6p6uyupn8kpXzQa8zxrau3U00g8CTT9hI';
app.use(cors());
app.use(express.json());
app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on http://0.0.0.0:3000');
});
const stripe = Stripe(secretKey, {
  apiVersion: '2024-06-20',
}   );

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
console.log(secretKey)
console.log('Stripe API Key set:', !!secretKey);

app.post('/create-payment-intent', async (req, res) => {
  if (!secretKey) {
    return res.status(500).json({ error: 'Stripe API key is not set' });
  }

  console.log(req.body);
  let amount = 1000;  // or use req.body.amount if you want to get it from the request
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});