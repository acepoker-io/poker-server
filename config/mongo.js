import mongoose from 'mongoose';

export const mongoConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    console.log('Connected to Mongo database');
  } catch (e) {
    console.log(`Error connecting to mongo database ${e}`);
  }
};
