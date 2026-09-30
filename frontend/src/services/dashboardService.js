import api from "./api";

export const getDashboardData = async () => {
  const [accountsResponse, tradesResponse] = await Promise.all([
    api.get("/accounts"),
    api.get("/trades"),
  ]);

  return {
    accounts: accountsResponse.data,
    trades: tradesResponse.data,
  };
};