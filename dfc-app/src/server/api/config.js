module.exports = function (router,config) {
  router.get('/config', async (req, res, next)=>{
    const publiConfig = {sources:config.sources};
    res.json(publiConfig)
  })
}
