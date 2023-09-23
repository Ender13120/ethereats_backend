

## EtherEats Order Service

This service is a part of the EtherEats decentralized delivery platform. It uses NestJS for the backend framework and interacts with Ethereum smart contracts using the Ethers.js library.

Deployed Endpoint:
ethereatsbackend-production.up.railway.app

### Routes:

1. **GET `/orders/:address`**:
   - Fetches all orders for a given Ethereum address.
   - Validates if the provided Ethereum address is correct.
   - Checks the reputation of the address from the associated smart contract. If the reputation is less than or equal to 0, it returns an error indicating the address is not eligible to see orders.
   - Decrypts the order parameters before sending them in the response.
   - **Response**: Returns the reputation of the address and the list of decrypted orders.

2. **POST `/orders/:id/signature`**:
   - Adds a signature to an order.
   - Validates the provided signature.
   - Retrieves the order based on the provided ID.
   - Verifies the message to ensure it came from the actual customer.
   - If the signature verification is successful, it updates the order with the provided signature.
   - **Request Body**: Contains the signature and the message for verification.
   - **Response**: Updates the order with the signature and returns the updated order.

### Additional Features:

- **Decryption Utility**: The service has a built-in utility to decrypt encrypted order data using AES encryption from the `crypto-js` library.
  
- **Ethereum Smart Contract Interaction**: The service interacts with an Ethereum smart contract to fetch the reputation of an address. It uses the Ethers.js library for all Ethereum-related operations.

---

You can further expand upon this, add installation steps, usage examples, or any other details you think might be relevant for users or contributors to your repository.