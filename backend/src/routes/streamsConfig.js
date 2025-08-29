const express = require('express');
const router = express.Router();
const storage = require('../storage/streamsConfig');
const validateSchema = require('../middleware/validateSchema');

// list
router.get('/', (req,res)=>{
  const all = storage.getAll();
  res.json(all);
});

// get
router.get('/:id',(req,res)=>{
  const item = storage.getById(req.params.id);
  if(!item) return res.status(404).json({ error: 'not found' });
  res.json(item);
});

// create
router.post('/', validateSchema('streamConfig.schema.json'), (req,res)=>{
  const body = req.body;
  const exists = storage.getById(body.id);
  if(exists) return res.status(409).json({ error: 'already exists' });
  storage.save(body);
  res.status(201).json(body);
});

// update
router.put('/:id', validateSchema('streamConfig.schema.json'), (req,res)=>{
  const body = req.body;
  if(!body) return res.status(400).json({ error: 'body required' });
  if(req.params.id !== body.id){ return res.status(400).json({ error: 'id mismatch' }); }
  const existing = storage.getById(req.params.id);
  if(!existing) return res.status(404).json({ error: 'not found' });
  storage.save(body);
  res.json(body);
});

// delete
router.delete('/:id',(req,res)=>{
  const existing = storage.getById(req.params.id);
  if(!existing) return res.status(404).json({ error: 'not found' });
  storage.remove(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
