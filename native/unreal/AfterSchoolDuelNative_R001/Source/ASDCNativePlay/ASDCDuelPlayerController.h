#pragma once
#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "ASDCDuelPlayerController.generated.h"
UCLASS()
class ASDCNATIVEPLAY_API AASDCDuelPlayerController : public APlayerController {
 GENERATED_BODY()
public:
 virtual void BeginPlay() override;
 virtual void SetupInputComponent() override;
private:
 void PlayCardOne();
 void PlayCardTwo();
 void PlayCardThree();
 void HandleCardClick();
 void ResetBattle();
};
