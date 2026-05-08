# Use the official .NET 6 SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /app

# Copy the solution file and restore dependencies
# Since we don't have a standard .sln, we'll restore the project directly
COPY src/EZPos.Web.Ui/EZPos.Web.Ui.csproj src/EZPos.Web.Ui/
RUN dotnet restore src/EZPos.Web.Ui/EZPos.Web.Ui.csproj

# Copy the remaining files and build
COPY . .
WORKDIR /app/src/EZPos.Web.Ui
RUN dotnet publish -c Release -o /out

# Use the official .NET 6 ASP.NET Core runtime image
FROM mcr.microsoft.com/dotnet/aspnet:6.0
WORKDIR /app
COPY --from=build /out .

# Exposure and environment variables for Render
ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000

# Start the application
# Render provides the PORT environment variable, we override the URL in the CMD
ENTRYPOINT ["sh", "-c", "dotnet EZPos.Web.Ui.dll --urls http://0.0.0.0:${PORT:-10000}"]
