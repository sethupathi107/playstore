import { Category } from "../sequelize/config/database.js";
import { logger } from "../utils/logger.js";

async function getAllCategories(req, res) {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function createCategory(req, res) {
    try {
        const { name } = req.body;

        const existingCategory = await Category.findOne({ where: { name } });

        if (existingCategory) {
            return res.status(409).json({ message: "Category already exists" });
        }

        const newCategory = await Category.create({ name });

        logger.info(`User ${req.user.id} created category ${newCategory.id} (${newCategory.name})`);

        res.status(201).json(newCategory);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function deleteCategory(req, res) {
    try {
        const { name } = req.body;

        const category = await Category.findOne({ where: { name } });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        await category.destroy();

        logger.info(`User ${req.user.id} deleted category ${category.id} (${category.name})`);

        res.json({ message: "Category deleted", category });
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default {
    getAllCategories,
    createCategory,
    deleteCategory
};
