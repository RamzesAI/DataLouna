import express, { Request, Response } from 'express';
import sql from '../sql';

const purchaseRouter = express.Router();

purchaseRouter.post('/', async (req: Request, res: Response) => {
  const userId = req.cookies.userId;
  const { productId, quantity } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: Please log in' });
		return;
  }

  if (!productId || !quantity || quantity <= 0) {
    res.status(400).json({ error: 'Product ID and valid quantity are required' });
		return;
  }

  try {
    await sql.begin(async (transaction) => {
      const [user] = await transaction`SELECT * FROM users WHERE id = ${userId}`;

      if (!user) {
        throw new Error('User not found');
      }

      const [product] = await transaction`SELECT * FROM products WHERE id = ${productId}`;
      if (!product) {
        throw new Error('Product not found');
      }

      const totalCost = product.price * quantity;

      if (user.balance < totalCost) {
        throw new Error('Insufficient balance');
      }

      const [purchase] = await transaction`
        INSERT INTO purchases (user_id)
        VALUES (${userId})
        RETURNING id;
      `;

      await transaction`
        INSERT INTO purchases_products (purchase_id, product_id, quantity)
        VALUES (${purchase.id}, ${productId}, ${quantity});
      `;

      const updatedBalance = user.balance - totalCost;
      await transaction`
        UPDATE users
        SET balance = ${updatedBalance}
        WHERE id = ${userId};
      `;

      res.status(200).json({
        message: 'Purchase successful',
        purchase: {
          purchaseId: purchase.id,
          productId,
          quantity,
          totalCost,
        },
        updatedBalance,
      });
    });
  } catch (error) {
    console.error('Error during purchase:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


export default purchaseRouter;
