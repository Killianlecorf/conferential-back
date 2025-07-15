async function checkAdmin(request: any, reply: any) {
  const currentUser = request.user;
  if (!currentUser || (!currentUser.isAdmin)) {
    return reply.status(403).send({ error: 'Access denied: you must be admin' });
  }
}

export default checkAdmin;