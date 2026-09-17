import { logger } from "../utils/logger.js";
import { Application } from "../sequelize/config/database.js";
import path from "node:path";
import fs from "fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "../../uploads");


async function getAllApps(req, res) {
    try {
        const app = await Application.findAll()
        res.json(app);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getAppById(req, res) {
    try {

        const {applicationid} = req.body;
        const app = await Application.findByPk(applicationid);

        if (!app) {
            return res.status(404).json({ message: "App not found" });
        }
        res.json(app);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function createApp(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Application file is required" });
        }
        const { name, categoryId,userId, description } = req.body;
        const applicationURL = req.file.filename;

        if (!name || !categoryId) {
            return res.status(400).json({
                message: "Name and category are required"
            });
        }
 
        const app =await Application.create({
            name,
            categoryId,
            description,
            userId,
            applicationURL
        })

        logger.info(`User ${req.user.id} created app ${app.id} (${app.name})`);
        res.status(201).json(app);

    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function updateApp(req, res) {
    try {
        const { id, name, categoryId, description } = req.body;

        if (!id) {
            return res.status(400).json({ message: "App id is required" });
        }

        const app = await Application.findByPk(id);

        if (!app) {
            return res.status(404).json({ message: "App not found" });
        }
        const oldFilename = app.applicationURL;

        if(name!== undefined) app.name = name;
        if(categoryId !== undefined) app.categoryId=categoryId;
        if(description !== undefined) app.description = description;
        if(req.file) app.applicationURL = req.file.filename;

        await app.save();

        if (req.file && oldFilename) {
            fs.unlink(path.join(UPLOAD_DIR, oldFilename)).catch((err) => {
                logger.error(`Failed to remove old app file ${oldFilename}: ${err.message}`);
            });
        }

        logger.info(`User ${req.user.id} updated app ${app.id} (${app.name})`);

        res.json(app);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function deleteApp(req, res) {
    try {
         const { applicationId,userId} = req.body;

        if (!applicationId) {
            return res.status(400).json({ message: "App applicationId is required" });
        }

        const app = await Application.findByPk(applicationId);

        if (!app) {
            return res.status(404).json({ message: "App not found" });
        }

        await app.destroy({transaction:t});

        fs.unlink(path.join(UPLOAD_DIR, app.applicationURL)).catch((err) => {
            logger.error(`Failed to remove old app file ${app.applicationURL}: ${err.message}`);
        });


        logger.info(`User ${req.user.id} deleted app ${app.id} (${app.applicationURL})`);

        res.json({ message: "App deleted", app: app });
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function downloadApp(req,res){
    try{
        const {applicationId} = req.body;

        const app = await Application.findByPk(applicationId);

        if(!app){
            return res.status(404).json({message:"App not fount"});
        }

        const filePath = path.join(UPLOAD_DIR,app.applicationURL);
        const downloadName = `${app.name}${path.extname(app.applicationURL)}`;

        res.download(filePath,downloadName,(err)=>{
            if(err){
                logger.error(err.stack || err.message);
                if(!res.headersSent){
                    res.status(404).json({message:"File not found on server"})
                }
            }
        })
    } catch (error){
        logger.error(error.stack || error.message);
        res.status(500).json({messafe:"Internal server error"});
    }
}



export default {
    getAllApps,
    getAppById,
    createApp,
    updateApp,
    deleteApp,
    downloadApp
};
