const express = require('express');
const mongoose=require('mongoose');
const http=require("http");

const {Server}= require("socket.io");
const cors= require('cors');

const app= express();
const server= http.createServer(app);

app.use(express.json());
app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", 
    methods: ["GET", "POST"],
  },
});

// Setup the Socket.IO connection
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
  
    // Join the user to a specific category room
    socket.on("joinCategory", (categoryId) => {
      socket.join(categoryId);
      console.log(`User ${socket.id} joined category: ${categoryId}`);
    });
  
    // Handle user disconnecting
    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    
    });
  });

  io.engine.on("connection_error", (err) => {
    console.log(err.req);      // the request object
    console.log(err.code);     // the error code, for example 1
    console.log(err.message);  // the error message, for example "Session ID unknown"
    console.log(err.context);  // some additional error context
  });


mongoose.connect("mongodb://127.0.0.1:27017/ournest",{
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(()=>console.log("Connected to DB"))
    .catch(console.error);

const Item = require('./models/Item');
const Category = require('./models/Category');


app.get("/item", async (req, res) => {
    const { category } = req.query;
    try {
      const query = category ? { category } : {}; // Filter by category if provided
      const items = await Item.find(query);
      res.json(items);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });
  
//Testing purposes
app.post('/item/new', (req, res)=>{
    const item = new Item({
        item: req.body.item
    })

    item.save();
    res.json(item)
})

app.post('/category/new', (req, res)=>{
    const category = new Category({
        name: req.body.name
    })

    category.save();
    res.json(category)
})

app.post('/item/add-to-category', async(req, res)=>{
    try{
        const {categoryId, itemName}= req.body;
        //Find the category
        const category= await Category.findById(categoryId);
        if(!category) return res.status(404).json({message: 'Category not found'});
        
        //Add the new item
        const item= new Item({
            item: itemName,
            category: category._id
        });
        await item.save();

        //Add items to categories array
        category.items.push(item._id);
        await category.save();

         // Populate the category with updated items
         const updatedCategory = await Category.findById(categoryId).populate('items');

         res.json(item);
        
    }catch(error){
        console.error(error);
        res.status(500).json({message: 'Internal server error'})
    }
})

//Add multiple items to category
app.post('/item/add-multiple', async(req, res)=>{
  try{
    const {categoryId, items}=req.body;
    console.log("Request Body", req.body);
    console.log("items", items);
    //Validate input
    if(!Array.isArray(items) || items.length===0){
      return res.status(400).json({message: "Items must be non-empty array"});
    }

    //Find Category
    const category= await Category.findById(categoryId);
    if (!category) return res.status(404).json({message: 'Category not found'})

  //Add each item to the database and associate with category
  const createdItems= await Promise.all(
    items.map(async (itemName)=>{
      const item= new Item({item: itemName, category: category._id});
      await item.save();
      return item;
    })
  );

  //add the new items to the ID category
  category.items.push(...createdItems.map((item)=> item.id));
  await category.save();

  // Populate the category with updated items
  const updatedCategory = await Category.findById(categoryId).populate('items');

  res.json({
    message: "Items added successfully",
    items: createdItems,
    category: updatedCategory,
  });

  }catch(error){
    console.error(error);
  }
})

//Get category
app.get('/category', async(req, res)=>{
    const category= await Category.find();

    res.json(category);
})

//delete item
app.delete("/item/delete/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await Item.findByIdAndDelete(id);
  
      if (!result) {
        return res.status(404).json({ error: "Item not found" });
      }
  
      res.json(result);
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

//delete category
// app.get('/category/delete/:id', async(req, res)=>{
//   try {
//     const { id } = req.params;
//     const result = await Category.findByIdAndDelete(id);

//     if (!result) {
//       return res.status(404).json({ error: "Item not found" });
//     }

//     res.json(result);
//   } catch (error) {
//     console.error("Error deleting item:", error);
//     res.status(500).json({ error: "Failed to delete category" });
//   }
// })
app.delete('/category/delete/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const result = await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted successfully", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});


//bought item
app.get('/item/bought/:id', async (req, res)=>{
    const item = await Item.findById(req.params.id);

    item.bought= !item.bought;

    item.save();

    res.json(item);
   
})



app.listen(3001, ()=> console.log("Server started on port 3001"));