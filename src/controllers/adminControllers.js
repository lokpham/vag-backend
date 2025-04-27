import { User, Video } from "../models/index.js";

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVideos = await Video.countDocuments();

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Bắt đầu từ thứ 2
    startOfWeek.setHours(0, 0, 0, 0); // Đặt giờ về 00:00:00
    
    // Video được tạo trong tuần
    const weeklyVideos = await Video.countDocuments({
      createdAt: { $gte: startOfWeek },
    });

    // Video được tạo theo từng ngày trong tuần
    const weeklyVideoStatsRaw  = await Video.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);

    const dayMap = {
      1: "Sun",
      2: "Mon",
      3: "Tue",
      4: "Wed",
      5: "Thu",
      6: "Fri",
      7: "Sat"
    };

    const weeklyVideoStats = Array.from({ length: 7 }, (_, i) => {
      const day = dayMap[i];
      const found = weeklyVideoStatsRaw.find(item => {
        const itemDay = new Date(item._id).getDay(); // Lấy thứ từ ngày
        return itemDay === i;
      });
    
      return {
        day,
        count: found ? found.count : 0,
      };
    });

    // Top user có nhiều video nhất
    const topUserAgg  = await Video.aggregate([
      {
        $group: {
          _id: "$user",
          videoCount: { $sum: 1 },
        }
      },
      {
        $sort: { videoCount: -1 },
      },
      {
        $limit: 1,
      },
      {
        $lookup: {
          from: "users", 
          localField: "_id", 
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo", 
      },
      {
        $project: {
          name: {
            $ifNull: ["$userInfo.fullName", "$userInfo.username"],
          },
          videoCount: 1,
        },
      },
    ])

    let topUser = null;
    if (topUserAgg.length > 0) {
      topUser = {
        name: topUserAgg[0].name,
        videoCount: topUserAgg[0].videoCount,
      };
    }
    else {
      topUser = [];
    }

    res.status(200).json({
      totalUsers,
      totalVideos,
      weeklyVideos,
      weeklyVideoStats,
      topUser,
    });

  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu dashboard:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
}

export const adminCountrollers = {
  getDashboardStats,
};