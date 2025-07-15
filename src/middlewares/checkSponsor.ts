async function checkSponsor(request: any, reply: any) {
  const currentUser = request.user;
  if (!currentUser || (!currentUser.isSponsor)) {
    return reply.status(403).send({ error: 'Access denied: you must be sponsor' });
  }
}

export default checkSponsor;