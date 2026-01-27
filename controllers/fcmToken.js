export const updateFCMToken = async (req, res) => {
  const { fcmToken } = req.body;

  req.user.fcmToken = fcmToken;
  req.user.lastFCMUpdate = new Date();
  await req.user.save();

  res.json({ success: true,msg: 'FCM token updated' });
};
