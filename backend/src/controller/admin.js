import { User, Application, Installed } from "../sequelize/config/database.js";
import { logger } from "../utils/logger.js";

async function getActivity(req, res) {
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

export default {
    getActivity
};
