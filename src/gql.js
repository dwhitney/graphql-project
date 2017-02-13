const API_ROOT = 'https://www.graphqlhub.com/graphql';

export async function gqlQuery(query = '', variables = null) {
  const method = 'POST';
  const headers = { 'Content-Type': 'application/json' };
  const body = JSON.stringify({
    query,
    variables,
    operationType: null
  });

  const response = await fetch(API_ROOT, { headers, body, method });
  return response.json();
}

