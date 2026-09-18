# Express Routes & API Patterns

## Standard Route Layout

```typescript
import { Router } from 'express';
import { AppError } from '../../shared/errors';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const result = await service.execute(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
