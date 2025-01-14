import { Router, Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import Redis from 'ioredis';

dotenv.config();

const router = Router();
const redis = new Redis(process.env.REDIS_URL as string);

const CACHE_EXPIRATION = 300;

router.get('/items-with-prices', async (req: Request, res: Response) => {
	try {
		const cacheKey = 'items_with_prices';

    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      console.log('Returning cached data');
      res.json(JSON.parse(cachedData));
			return;
    }
		
		const username = process.env.SKINPORT_ID as string;
    const password = process.env.SKINPORT_KEY as string;

    if (!username || !password) {
      res.status(500).json({ error: 'Missing API credentials' });
			return;
    }

		const [tradableItems, nonTradableItems] = await Promise.all([
      fetchItems(username, password, true),
      fetchItems(username, password, false),
    ]);

    const result = mergePrices(tradableItems, nonTradableItems);

		await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_EXPIRATION);
		
    res.json(result);
	
		return;
	} catch (error) {
    console.error('Error fetching items:', error);

    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({ error: error.response.data });
			return;
    } else {
      res.status(500).json({ error: 'Internal server error' });
			return;
    }
  }
});

async function fetchItems(username: string, password: string, tradable: boolean) {
  const response = await axios.get(`https://api.skinport.com/v1/items?tradable=${tradable}`, {
    auth: {
      username,
      password,
    },
  });
  return response.data;
}


function mergePrices(tradableItems: any[], nonTradableItems: any[]) {
  const priceMap: Record<string, { tradableMinPrice?: number; nonTradableMinPrice?: number }> = {};

  for (const item of tradableItems) {
    const { market_hash_name, min_price } = item;
    if (!priceMap[market_hash_name]) {
      priceMap[market_hash_name] = {};
    }
    priceMap[market_hash_name].tradableMinPrice = min_price;
  }

  for (const item of nonTradableItems) {
    const { market_hash_name, min_price } = item;
    if (!priceMap[market_hash_name]) {
      priceMap[market_hash_name] = {};
    }
    priceMap[market_hash_name].nonTradableMinPrice = min_price;
  }

  return Object.entries(priceMap).map(([market_hash_name, prices]) => ({
    market_hash_name,
    tradableMinPrice: prices.tradableMinPrice || null,
    nonTradableMinPrice: prices.nonTradableMinPrice || null,
  }));
}

export default router;
