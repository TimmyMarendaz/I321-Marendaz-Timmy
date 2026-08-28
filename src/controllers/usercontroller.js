const getUsers = (req, res) => {
    const users = [
        {
            id: 1,
            name: 'Alice'
        }
    ];
    res.json(users);
};
module.exports = {
    getUsers
};