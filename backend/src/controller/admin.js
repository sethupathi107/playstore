import client from '../utils/redisClient.js'
import { User, Application, Installed, Logs } from "../sequelize/config/database.js";
import { logger } from "../utils/logger.js";

async function getActivity(req, res) {

    const cacheKey="admin"

    try{
        const activity = await client.get(cacheKey);
        if(activity){
            return res.status(200).json(JSON.parse(activity));
        }
    }catch(error){
        logger.error("Redis GET failed, falling back to DB:",error.message);
    }
    
    try {
        const [totalUsers, totalApps, totalDownloads, apps, downloadActivity, users] = await Promise.all([
            User.count(),
            Application.count(),
            Installed.count(),
            Application.findAll({
                include: [{ model: User, as: "user", attributes: ["id", "username", "email"] }],
            }),
            Installed.findAll({
                include: [
                    { model: User, as: "user", attributes: ["id", "username", "email"] },
                    { model: Application, as: "application", attributes: ["id", "name"] },
                ],
                order: [["createdAt", "DESC"]],
            }),
            User.findAll({ attributes: { exclude: ["password"] } }),
        ]);

        const payload = { totalUsers, totalApps, totalDownloads, apps, downloadActivity, users };

        try{
            await client.set(cacheKey, JSON.stringify(payload), { EX: 60 });
        } catch(error){
            logger.error("Redis SET failed: ",error.message);
        }

        logger.info(`User ${req.user.id} viewed the admin activity dashboard`);

        res.json({
            totalUsers,
            totalApps,
            totalDownloads,
            apps,
            downloadActivity,
            users,
        });
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}


async function getLogs(req, res) {
    try {
        const limit = Number(req.query.limit) || 100;

        const logs = await Logs.findAll({
            order: [["createdAt", "DESC"]],
            limit,
        });

        res.json(logs);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default {
    getActivity,
    getLogs
};
