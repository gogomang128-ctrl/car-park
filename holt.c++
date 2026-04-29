#include <iostream>
#include <vector>
#include <cmath>
#include <ctime>
#include <cstdlib>

#define PI 3.14159265358979323846

// ==========================
// Vector2 Struct
// ==========================
struct Vec2 {
    float x;
    float y;
};

// ==========================
// Car Class
// ==========================
class Car {
public:
    Vec2 position;
    float angle;
    float speed;

    float acceleration;
    float maxSpeed;
    float turnSpeed;
    float friction;

    float width;
    float height;

    float damage;
    float maxDamage;

    Car(float w, float h, float accel, float maxSpd, float turn, float fric) {
        position = { 200, 200 };
        angle = -PI / 2;
        speed = 0;
        width = w;
        height = h;
        acceleration = accel;
        maxSpeed = maxSpd;
        turnSpeed = turn;
        friction = fric;
        damage = 0;
        maxDamage = 100;
    }

    void Update(bool gas, bool brake, bool reverse, bool left, bool right) {

        if (gas) speed += acceleration;
        if (brake) speed -= acceleration * 2.0f;
        if (reverse) speed -= acceleration * 0.7f;

        if (!gas && !brake && !reverse)
            speed *= friction;

        if (speed > maxSpeed) speed = maxSpeed;
        if (speed < -maxSpeed * 0.5f) speed = -maxSpeed * 0.5f;

        if (fabs(speed) > 0.1f) {
            float steerFactor = turnSpeed * (speed > 0 ? 1 : -1);
            if (left) angle -= steerFactor;
            if (right) angle += steerFactor;
        }

        position.x += sin(angle) * speed;
        position.y -= cos(angle) * speed;
    }

    void AddDamage(float amount) {
        damage += amount;
        if (damage > maxDamage)
            damage = maxDamage;
    }

    bool IsDestroyed() const {
        return damage >= maxDamage;
    }
};

// ==========================
// Parking Spot
// ==========================
class ParkingSpot {
public:
    Vec2 position;
    float width;
    float height;
    float angle;

    ParkingSpot(float x, float y, float w, float h) {
        position = { x, y };
        width = w;
        height = h;
        angle = 0;
    }

    bool CheckPark(const Car& car) {
        float dx = car.position.x - position.x;
        float dy = car.position.y - position.y;

        float dist = sqrt(dx * dx + dy * dy);

        if (dist < 15 && fabs(car.speed) < 0.1f) {

            float angleDiff = fabs(car.angle - angle);
            if (angleDiff < 0.3f || fabs(angleDiff - PI) < 0.3f)
                return true;
        }
        return false;
    }
};

// ==========================
// Game Class
// ==========================
class ParkingGame {
private:
    Car* player;
    ParkingSpot* spot;

    int money;
    int missionTime;
    time_t startTime;

public:

    ParkingGame() {
        player = new Car(30, 55, 0.08f, 3.0f, 0.035f, 0.97f);
        spot = new ParkingSpot(600, 600, 50, 75);
        money = 1000;
        missionTime = 60;
        startTime = time(NULL);
    }

    void Update(bool gas, bool brake, bool reverse, bool left, bool right) {

        player->Update(gas, brake, reverse, left, right);

        // Simple boundary collision
        if (player->position.x < 0 || player->position.x > 1000 ||
            player->position.y < 0 || player->position.y > 1000) {
            player->AddDamage(5);
        }

        if (spot->CheckPark(*player)) {
            CompleteMission();
        }

        if (player->IsDestroyed()) {
            std::cout << "🚨 السيارة تدمرت! فشلت المهمة.\n";
            exit(0);
        }

        CheckTimer();
    }

    void CompleteMission() {
        int elapsed = time(NULL) - startTime;
        int timeBonus = missionTime - elapsed;
        if (timeBonus < 0) timeBonus = 0;

        int reward = 200 + (timeBonus * 5);
        money += reward;

        std::cout << "✅ تم الركن بنجاح!\n";
        std::cout << "💰 المكافأة: $" << reward << "\n";
        std::cout << "💵 رصيدك الحالي: $" << money << "\n";

        exit(0);
    }

    void CheckTimer() {
        int elapsed = time(NULL) - startTime;
        if (elapsed > missionTime) {
            std::cout << "⏰ انتهى الوقت! فشلت المهمة.\n";
            exit(0);
        }
    }

    void PrintStatus() {
        std::cout << "الموقع: (" << player->position.x << ", " << player->position.y << ")\n";
        std::cout << "السرعة: " << player->speed << "\n";
        std::cout << "الضرر: " << player->damage << "%\n";
        std::cout << "-----------------------\n";
    }
};

// ==========================
// MAIN
// ==========================
int main() {

    ParkingGame game;

    while (true) {

        bool gas = false, brake = false, reverse = false, left = false, right = false;

        char input;
        std::cout << "W = Gas | S = Brake | R = Reverse | A = Left | D = Right\n";
        std::cin >> input;

        if (input == 'w') gas = true;
        if (input == 's') brake = true;
        if (input == 'r') reverse = true;
        if (input == 'a') left = true;
        if (input == 'd') right = true;

        game.Update(gas, brake, reverse, left, right);
        game.PrintStatus();
    }

    return 0;
}