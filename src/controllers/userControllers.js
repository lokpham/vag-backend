import { User } from "../models/index.js";


const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) { res.status(500).json(error); }
}

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);  
    res.status(200).json("Delete success");
  } catch (error) { res.status(500).json(error); }
}

export const userControllers = {
  getAllUsers,
  deleteUser,
}