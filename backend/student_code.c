
#include <stdio.h>


// refer main function by clicking on "show main function"
// write a function with respective logic and return it to main function
    int add (int a, int b){
        return a+b;
    }

int main() {
    int a, b;
    sscanf("123 456", "%d %d", &a, &b);
    int sum = add(a, b);
    printf("%d", sum);
    return 0;
}
        