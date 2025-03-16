"use server";
import { connectToDatabase } from "../database/mongoose";
import User from "../database/models/user.model";

export async function createUser(userData: createUserProps) {
  try {
    await connectToDatabase();
    const newUser = await User.create(userData);
    return newUser;
  } catch (error) {
    console.log("Error while creating the user: ", error);
    throw error;
  }
}

export async function updateUser(params: updateUserProps) {
  try {
    await connectToDatabase();
    const { clerkId, updateData } = params;

    await User.findOneAndUpdate({ clerkId }, updateData);
  } catch (error) {
    console.log("Error while updated the user: ", error);
    throw error;
  }
}

export async function deleteUser(params: deleteUserProps) {
  try {
    await connectToDatabase();
    const { clerkId } = params;

    await User.findOneAndDelete({ clerkId });
  } catch (error) {
    console.log("Error while deleting the user: ", error);
    throw error;
  }
}

export async function getUserById({ userId }: { userId: string }) {
  try {
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    return JSON.stringify(user);
  } catch (error) {
    console.log("Error while fetching the user: ", error);
    throw error;
  }
}
