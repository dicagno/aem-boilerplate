// eslint-disable-next-line import/no-extraneous-dependencies
import { Router } from 'itty-router';

const wrapRouter = (env) => {
// now let's create a router (note the lack of "new")
  const router = Router();
  const braintreeEncodedCredentials = btoa(`${env.BRAINTREE_PUBLIC_KEY}:${env.BRAINTREE_PRIVATE_KEY}`);

  router.get('/api/v1/payment/client_token', async (request) => {
    const { customerId } = request.query;

    const graphqlQuery = JSON.stringify({
      query: `mutation ExampleClientToken($input: CreateClientTokenInput) {
      createClientToken(input: $input) {
        clientToken
      }
    }`,
      variables: {
        input: {
          clientToken: {
            customerId,
          },
        },
      },
    });

    // Setup the request options
    const requestOptions = {
      method: 'POST',
      headers: {
        Authorization: `Basic ${braintreeEncodedCredentials}`,
        'Content-Type': 'application/json',
        'Braintree-Version': env.BRAINTREE_VERSION,
      },
      body: graphqlQuery,
    };

    const response = await fetch(env.BRAINTREE_ENDPOINT, requestOptions);

    const responseData = await response.json();
    return new Response(JSON.stringify({ ...responseData.data }), { status: 200 });
  });

  router.post('/api/v1/payment/transaction', async (request) => {
    const { customerId } = request.query;

    const graphqlQuery = JSON.stringify({
      query: `mutation ExampleClientToken($input: CreateClientTokenInput) {
      createClientToken(input: $input) {
        clientToken
      }
    }`,
      variables: {
        input: {
          clientToken: {
            customerId,
          },
        },
      },
    });

    // Setup the request options
    const requestOptions = {
      method: 'POST',
      headers: {
        Authorization: `Basic ${braintreeEncodedCredentials}`,
        'Content-Type': 'application/json',
        'Braintree-Version': env.BRAINTREE_VERSION,
      },
      body: graphqlQuery,
    };

    const response = await fetch(env.BRAINTREE_ENDPOINT, requestOptions);

    const responseData = await response.json();
    return new Response(JSON.stringify({ ...responseData.data }), { status: 200 });
  });

  // GET item
  router.get('/api/todos/:id', ({ params }) => new Response(`Todo #${params.id}`));

  // POST to the collection (we'll use async here)
  router.post('/api/todos', async (request) => {
    const content = await request.json();

    return new Response(`Creating Todo: ${JSON.stringify(content)}`);
  });

  // 404 for everything else
  router.all('*', () => new Response('Not Found.', { status: 404 }));

  return router;
};

export default wrapRouter;
